"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric"; // v6 import
import { useAppStore } from "@/lib/store";

export default function CertificateEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasInstance = useRef<fabric.Canvas | null>(null);
  const setTemplateJson = useAppStore((state) => state.setTemplateJson);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(
    null
  );
  const [bgColor, setBgColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(20);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [sizePreset, setSizePreset] = useState("800x600");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (canvasRef.current && !canvasInstance.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: canvasSize.width,
        height: canvasSize.height,
        backgroundColor: "#ffffff",
      });
      canvasInstance.current = canvas;

      // Add a default placeholder
      const text = new fabric.IText("Certificate of Achievement", {
        left: 200,
        top: 50,
        fontFamily: "Arial",
        fontSize: 30,
      });
      canvas.add(text);

      const namePlaceholder = new fabric.IText("{{name}}", {
        left: 300,
        top: 200,
        fontFamily: "Arial",
        fontSize: 40,
        fill: "black",
      });
      canvas.add(namePlaceholder);

      // Event listeners
      const updateSelection = (e: { selected: fabric.Object[] }) => {
        const selected = e.selected?.[0];
        setSelectedObject(selected || null);
        if (
          selected &&
          (selected.type === "i-text" || selected.type === "text")
        ) {
          setFontFamily((selected as fabric.IText).fontFamily || "Arial");
          setFontSize((selected as fabric.IText).fontSize || 20);
        }
      };

      canvas.on("selection:created", updateSelection);
      canvas.on("selection:updated", updateSelection);
      canvas.on("selection:cleared", () => setSelectedObject(null));

      // Snapping Logic
      const SNAP_DIST = 10;
      const guidelines: fabric.Line[] = [];

      const clearGuidelines = () => {
        guidelines.forEach((line) => canvas.remove(line));
        guidelines.length = 0;
      };

      const drawGuideline = (
        x1: number,
        y1: number,
        x2: number,
        y2: number
      ) => {
        const line = new fabric.Line([x1, y1, x2, y2], {
          stroke: "magenta",
          strokeWidth: 1,
          selectable: false,
          evented: false,
          strokeDashArray: [5, 5],
          opacity: 0.8,
        });
        // Mark as guideline to ignore in snap calculations
        (line as any).isGuideline = true;
        guidelines.push(line);
        canvas.add(line);
      };

      canvas.on("object:moving", (e) => {
        const obj = e.target;
        if (!obj) return;

        const canvasWidth = canvas.width || 0;
        const canvasHeight = canvas.height || 0;

        clearGuidelines();

        // Get object bounds (absolute coordinates)
        const bound = obj.getBoundingRect();
        const objLeft = bound.left;
        const objRight = bound.left + bound.width;
        const objCenter = bound.left + bound.width / 2;
        const objTop = bound.top;
        const objBottom = bound.top + bound.height;
        const objMiddle = bound.top + bound.height / 2;

        // Targets
        const targetsX: number[] = [0, canvasWidth / 2, canvasWidth];
        const targetsY: number[] = [0, canvasHeight / 2, canvasHeight];

        canvas.getObjects().forEach((o) => {
          if (o === obj || (o as any).isGuideline) return;
          const b = o.getBoundingRect();
          targetsX.push(b.left, b.left + b.width / 2, b.left + b.width);
          targetsY.push(b.top, b.top + b.height / 2, b.top + b.height);
        });

        // Find closest snap
        let minDistX = SNAP_DIST;
        let minDistY = SNAP_DIST;
        let deltaX = 0;
        let deltaY = 0;
        let snappedXTarget = 0;
        let snappedYTarget = 0;

        // X Snapping
        for (const target of targetsX) {
          if (Math.abs(objLeft - target) < minDistX) {
            minDistX = Math.abs(objLeft - target);
            deltaX = target - objLeft;
            snappedXTarget = target;
          }
          if (Math.abs(objRight - target) < minDistX) {
            minDistX = Math.abs(objRight - target);
            deltaX = target - objRight;
            snappedXTarget = target;
          }
          if (Math.abs(objCenter - target) < minDistX) {
            minDistX = Math.abs(objCenter - target);
            deltaX = target - objCenter;
            snappedXTarget = target;
          }
        }

        // Y Snapping
        for (const target of targetsY) {
          if (Math.abs(objTop - target) < minDistY) {
            minDistY = Math.abs(objTop - target);
            deltaY = target - objTop;
            snappedYTarget = target;
          }
          if (Math.abs(objBottom - target) < minDistY) {
            minDistY = Math.abs(objBottom - target);
            deltaY = target - objBottom;
            snappedYTarget = target;
          }
          if (Math.abs(objMiddle - target) < minDistY) {
            minDistY = Math.abs(objMiddle - target);
            deltaY = target - objMiddle;
            snappedYTarget = target;
          }
        }

        // Apply snap
        if (Math.abs(deltaX) > 0) {
          obj.set({ left: obj.left + deltaX });
          drawGuideline(snappedXTarget, 0, snappedXTarget, canvasHeight);
        }
        if (Math.abs(deltaY) > 0) {
          obj.set({ top: obj.top + deltaY });
          drawGuideline(0, snappedYTarget, canvasWidth, snappedYTarget);
        }
      });

      canvas.on("mouse:up", () => {
        clearGuidelines();
      });

      // Handle delete key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Delete" || e.key === "Backspace") {
          // Prevent deletion if typing in an input
          if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement
          ) {
            return;
          }

          const activeObjects = canvas.getActiveObjects();
          if (activeObjects.length) {
            canvas.discardActiveObject();
            activeObjects.forEach((obj) => {
              canvas.remove(obj);
            });
            canvas.requestRenderAll();
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        canvas.dispose();
        canvasInstance.current = null;
      };
    }
  }, [mounted]);

  const addText = () => {
    if (canvasInstance.current) {
      const text = new fabric.IText("New Text", {
        left: 100,
        top: 100,
        fontFamily: "Arial",
        fontSize: 20,
      });
      canvasInstance.current.add(text);
      canvasInstance.current.setActiveObject(text);
    }
  };

  const handleBgColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setBgColor(color);
    if (canvasInstance.current) {
      canvasInstance.current.backgroundColor = color;
      canvasInstance.current.renderAll();
    }
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const font = e.target.value;
    setFontFamily(font);
    if (
      canvasInstance.current &&
      selectedObject &&
      (selectedObject.type === "i-text" || selectedObject.type === "text")
    ) {
      (selectedObject as fabric.IText).set("fontFamily", font);
      canvasInstance.current.renderAll();
    }
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value, 10);
    setFontSize(size);
    if (
      canvasInstance.current &&
      selectedObject &&
      (selectedObject.type === "i-text" || selectedObject.type === "text")
    ) {
      (selectedObject as fabric.IText).set("fontSize", size);
      canvasInstance.current.renderAll();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvasInstance.current) return;

    const reader = new FileReader();
    reader.onload = async (f) => {
      const data = f.target?.result as string;
      if (data) {
        const img = await fabric.Image.fromURL(data);
        img.scaleToWidth(200);
        canvasInstance.current?.add(img);
        canvasInstance.current?.centerObject(img);
        canvasInstance.current?.setActiveObject(img);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSizePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSizePreset(value);
    if (value !== "custom") {
      const [w, h] = value.split("x").map(Number);
      setCanvasSize({ width: w, height: h });
      if (canvasInstance.current) {
        canvasInstance.current.setDimensions({ width: w, height: h });
      }
    }
  };

  const handleCustomSizeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "width" | "height"
  ) => {
    const val = parseInt(e.target.value, 10) || 0;
    setCanvasSize((prev) => {
      const newSize = { ...prev, [type]: val };
      if (canvasInstance.current) {
        canvasInstance.current.setDimensions(newSize);
      }
      return newSize;
    });
  };

  const saveTemplate = () => {
    if (canvasInstance.current) {
      const json = canvasInstance.current.toJSON();
      setTemplateJson(json);
      alert("Template saved!");
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-4 p-4 border border-black rounded-lg bg-white">
      <h2 className="text-xl font-bold">1. Design Certificate</h2>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 p-4 border border-black rounded bg-gray-50 items-center">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase">Canvas Size</label>
          <select
            value={sizePreset}
            onChange={handleSizePresetChange}
            className="h-8 px-2 border border-black bg-white"
          >
            <option value="800x600">Default (800x600)</option>
            <option value="1123x794">A4 Landscape</option>
            <option value="1056x816">Letter Landscape</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {sizePreset === "custom" && (
          <div className="flex gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase">Width</label>
              <input
                type="number"
                value={canvasSize.width}
                onChange={(e) => handleCustomSizeChange(e, "width")}
                className="h-8 w-20 px-2 border border-black"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase">Height</label>
              <input
                type="number"
                value={canvasSize.height}
                onChange={(e) => handleCustomSizeChange(e, "height")}
                className="h-8 w-20 px-2 border border-black"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase">Background</label>
          <input
            type="color"
            value={bgColor}
            onChange={handleBgColorChange}
            className="h-8 w-16 cursor-pointer border border-black"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase">Font</label>
          <select
            value={fontFamily}
            onChange={handleFontFamilyChange}
            className="h-8 px-2 border border-black bg-white"
            disabled={
              !selectedObject ||
              (selectedObject.type !== "i-text" &&
                selectedObject.type !== "text")
            }
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase">Size</label>
          <input
            type="number"
            value={fontSize}
            onChange={handleFontSizeChange}
            className="h-8 w-20 px-2 border border-black"
            disabled={
              !selectedObject ||
              (selectedObject.type !== "i-text" &&
                selectedObject.type !== "text")
            }
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase">Add Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="text-sm file:mr-4 file:py-1 file:px-4 file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
          />
        </div>
      </div>

      <div className="border border-black shadow-sm overflow-hidden w-fit mx-auto">
        <canvas ref={canvasRef} />
      </div>

      <div className="flex gap-2">
        <button
          onClick={addText}
          className="px-4 py-2 bg-black text-white border border-black rounded hover:bg-white hover:text-black transition-colors"
        >
          Add Text
        </button>
        <button
          onClick={saveTemplate}
          className="px-4 py-2 bg-white text-black border border-black rounded hover:bg-black hover:text-white transition-colors"
        >
          Save Template
        </button>
      </div>
      <p className="text-sm text-black">
        Use <code>{`{{variable}}`}</code> syntax for dynamic fields.
      </p>
    </div>
  );
}
