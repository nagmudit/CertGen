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
  const [layers, setLayers] = useState<fabric.Object[]>([]);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

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

      // Update layers when objects change
      const updateLayers = () => {
        const objs = canvas
          .getObjects()
          .filter(
            (o) => !(o as fabric.Object & { isGuideline?: boolean }).isGuideline
          );
        setLayers([...objs]);
      };
      canvas.on("object:added", updateLayers);
      canvas.on("object:removed", updateLayers);
      canvas.on("object:modified", updateLayers);
      updateLayers();

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
        (line as fabric.Object & { isGuideline?: boolean }).isGuideline = true;
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
          if (
            o === obj ||
            (o as fabric.Object & { isGuideline?: boolean }).isGuideline
          )
            return;
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

      // Snapping during scaling/resizing
      canvas.on("object:scaling", (e) => {
        const obj = e.target;
        if (!obj) return;

        const canvasWidth = canvas.width || 0;
        const canvasHeight = canvas.height || 0;

        clearGuidelines();

        // Get object bounds after current scale
        const bound = obj.getBoundingRect();
        const objLeft = bound.left;
        const objRight = bound.left + bound.width;
        const objTop = bound.top;
        const objBottom = bound.top + bound.height;

        // Targets for snapping
        const targetsX: number[] = [0, canvasWidth / 2, canvasWidth];
        const targetsY: number[] = [0, canvasHeight / 2, canvasHeight];

        canvas.getObjects().forEach((o) => {
          if (
            o === obj ||
            (o as fabric.Object & { isGuideline?: boolean }).isGuideline
          )
            return;
          const b = o.getBoundingRect();
          targetsX.push(b.left, b.left + b.width / 2, b.left + b.width);
          targetsY.push(b.top, b.top + b.height / 2, b.top + b.height);
        });

        // Determine which corner/edge is being dragged
        const corner = (obj as fabric.Object & { __corner?: string }).__corner;

        // Snap right edge (for right-side handles)
        if (corner === "mr" || corner === "tr" || corner === "br") {
          for (const target of targetsX) {
            if (Math.abs(objRight - target) < SNAP_DIST) {
              const newWidth = target - objLeft;
              const origWidth = (obj.width || 1) * (obj.scaleX || 1);
              const newScaleX = (obj.scaleX || 1) * (newWidth / origWidth);
              obj.set({ scaleX: newScaleX });
              drawGuideline(target, 0, target, canvasHeight);
              break;
            }
          }
        }

        // Snap left edge (for left-side handles)
        if (corner === "ml" || corner === "tl" || corner === "bl") {
          for (const target of targetsX) {
            if (Math.abs(objLeft - target) < SNAP_DIST) {
              const currentRight = objRight;
              const newWidth = currentRight - target;
              const origWidth = (obj.width || 1) * (obj.scaleX || 1);
              const newScaleX = (obj.scaleX || 1) * (newWidth / origWidth);
              obj.set({ scaleX: newScaleX, left: target });
              drawGuideline(target, 0, target, canvasHeight);
              break;
            }
          }
        }

        // Snap bottom edge (for bottom handles)
        if (corner === "mb" || corner === "br" || corner === "bl") {
          for (const target of targetsY) {
            if (Math.abs(objBottom - target) < SNAP_DIST) {
              const newHeight = target - objTop;
              const origHeight = (obj.height || 1) * (obj.scaleY || 1);
              const newScaleY = (obj.scaleY || 1) * (newHeight / origHeight);
              obj.set({ scaleY: newScaleY });
              drawGuideline(0, target, canvasWidth, target);
              break;
            }
          }
        }

        // Snap top edge (for top handles)
        if (corner === "mt" || corner === "tl" || corner === "tr") {
          for (const target of targetsY) {
            if (Math.abs(objTop - target) < SNAP_DIST) {
              const currentBottom = objBottom;
              const newHeight = currentBottom - target;
              const origHeight = (obj.height || 1) * (obj.scaleY || 1);
              const newScaleY = (obj.scaleY || 1) * (newHeight / origHeight);
              obj.set({ scaleY: newScaleY, top: target });
              drawGuideline(0, target, canvasWidth, target);
              break;
            }
          }
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
  }, [mounted, canvasSize]);

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

  // Extract variables from canvas text
  const extractVariables = (): string[] => {
    if (!canvasInstance.current) return [];
    const vars: string[] = [];
    canvasInstance.current.getObjects().forEach((obj) => {
      if (obj.type === "i-text" || obj.type === "text") {
        const text = (obj as fabric.IText).text || "";
        const matches = text.match(/\{\{([^}]+)\}\}/g);
        if (matches) {
          matches.forEach((m) => {
            const varName = m.replace(/\{\{|\}\}/g, "").trim();
            if (!vars.includes(varName)) vars.push(varName);
          });
        }
      }
    });
    return vars;
  };

  // Open test dialog
  const openTestDialog = () => {
    const vars = extractVariables();
    const initial: Record<string, string> = {};
    vars.forEach((v) => (initial[v] = ""));
    setVariableValues(initial);
    setPreviewDataUrl(null);
    setShowTestDialog(true);
  };

  // Generate preview
  const generatePreview = async () => {
    if (!canvasInstance.current) return;
    // Clone canvas JSON
    const json = canvasInstance.current.toJSON();
    const currentBgColor = canvasInstance.current.backgroundColor;
    // Create temporary canvas
    const tempCanvas = document.createElement("canvas");
    const fabricTemp = new fabric.Canvas(tempCanvas, {
      width: canvasSize.width,
      height: canvasSize.height,
    });
    await fabricTemp.loadFromJSON(json);
    // Ensure background color is set
    fabricTemp.backgroundColor = currentBgColor || "#ffffff";
    // Replace variables in text objects
    fabricTemp.getObjects().forEach((obj) => {
      if (obj.type === "i-text" || obj.type === "text") {
        let text = (obj as fabric.IText).text || "";
        Object.entries(variableValues).forEach(([key, val]) => {
          // Handle spaces around variable names: {{ Name }} or {{Name}}
          text = text.replace(
            new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi"),
            val
          );
        });
        (obj as fabric.IText).set("text", text);
      }
    });
    fabricTemp.renderAll();
    const dataUrl = fabricTemp.toDataURL({ format: "png", multiplier: 2 });
    setPreviewDataUrl(dataUrl);
    fabricTemp.dispose();
  };

  // Download preview
  const downloadPreview = () => {
    if (!previewDataUrl) return;
    const link = document.createElement("a");
    link.download = "certificate.png";
    link.href = previewDataUrl;
    link.click();
  };

  // Layer management
  const moveLayerUp = (index: number) => {
    if (!canvasInstance.current || index >= layers.length - 1) return;
    const obj = layers[index];
    canvasInstance.current.bringObjectForward(obj);
    setLayers([
      ...canvasInstance.current
        .getObjects()
        .filter(
          (o) => !(o as fabric.Object & { isGuideline?: boolean }).isGuideline
        ),
    ]);
  };

  const moveLayerDown = (index: number) => {
    if (!canvasInstance.current || index <= 0) return;
    const obj = layers[index];
    canvasInstance.current.sendObjectBackwards(obj);
    setLayers([
      ...canvasInstance.current
        .getObjects()
        .filter(
          (o) => !(o as fabric.Object & { isGuideline?: boolean }).isGuideline
        ),
    ]);
  };

  const selectLayer = (obj: fabric.Object) => {
    if (!canvasInstance.current) return;
    canvasInstance.current.setActiveObject(obj);
    canvasInstance.current.renderAll();
  };

  const getLayerName = (obj: fabric.Object): string => {
    if (obj.type === "i-text" || obj.type === "text") {
      const text = (obj as fabric.IText).text || "";
      return text.length > 20 ? text.substring(0, 20) + "..." : text;
    }
    if (obj.type === "image") return "Image";
    return obj.type || "Object";
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
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={bgColor}
              onChange={(e) => {
                setBgColor(e.target.value);
                if (canvasInstance.current) {
                  canvasInstance.current.backgroundColor = e.target.value;
                  canvasInstance.current.renderAll();
                }
              }}
              className="h-8 w-20 px-2 border border-black text-xs"
              placeholder="#ffffff"
            />
            <input
              type="color"
              value={bgColor}
              onChange={handleBgColorChange}
              className="h-8 w-8 cursor-pointer border border-black p-0"
              style={{ WebkitAppearance: "none" }}
            />
          </div>
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

      <div className="flex gap-4">
        <div className="border border-black shadow-sm overflow-hidden w-fit">
          <canvas ref={canvasRef} />
        </div>

        {/* Layers Panel */}
        <div className="w-48 border border-black rounded bg-gray-50 flex flex-col">
          <div className="p-2 border-b border-black bg-black text-white text-xs font-bold uppercase">
            Layers
          </div>
          <div className="flex-1 overflow-y-auto max-h-96">
            {[...layers].reverse().map((obj, idx) => {
              const realIndex = layers.length - 1 - idx;
              const isSelected = selectedObject === obj;
              return (
                <div
                  key={idx}
                  onClick={() => selectLayer(obj)}
                  className={`flex items-center justify-between p-2 border-b border-gray-200 cursor-pointer text-xs hover:bg-gray-100 ${
                    isSelected ? "bg-gray-200" : ""
                  }`}
                >
                  <span className="truncate flex-1">{getLayerName(obj)}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLayerUp(realIndex);
                      }}
                      className="px-1 hover:bg-black hover:text-white rounded"
                      title="Bring Forward"
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLayerDown(realIndex);
                      }}
                      className="px-1 hover:bg-black hover:text-white rounded"
                      title="Send Backward"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              );
            })}
            {layers.length === 0 && (
              <div className="p-2 text-xs text-gray-500">No objects</div>
            )}
          </div>
        </div>
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
        <button
          onClick={openTestDialog}
          className="px-4 py-2 bg-white text-black border border-black rounded hover:bg-black hover:text-white transition-colors"
        >
          Test Certificate
        </button>
      </div>
      <p className="text-sm text-black">
        Use <code>{`{{variable}}`}</code> syntax for dynamic fields.
      </p>

      {/* Test Certificate Dialog */}
      {showTestDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-black rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Test Certificate</h3>
              <button
                onClick={() => setShowTestDialog(false)}
                className="text-xl font-bold hover:text-gray-500"
              >
                ×
              </button>
            </div>

            {!previewDataUrl ? (
              <>
                <p className="text-sm mb-4">
                  Enter values for the variables used in your certificate:
                </p>
                {Object.keys(variableValues).length === 0 ? (
                  <p className="text-sm text-gray-500 mb-4">
                    No variables found. Use {`{{variableName}}`} syntax in text.
                  </p>
                ) : (
                  <div className="space-y-3 mb-4">
                    {Object.keys(variableValues).map((varName) => (
                      <div key={varName} className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase">
                          {varName}
                        </label>
                        <input
                          type="text"
                          value={variableValues[varName]}
                          onChange={(e) =>
                            setVariableValues((prev) => ({
                              ...prev,
                              [varName]: e.target.value,
                            }))
                          }
                          className="h-8 px-2 border border-black"
                          placeholder={`Enter ${varName}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={generatePreview}
                  className="px-4 py-2 bg-black text-white border border-black rounded hover:bg-white hover:text-black transition-colors"
                >
                  Generate Preview
                </button>
              </>
            ) : (
              <>
                <div className="border border-black mb-4 overflow-auto max-h-[60vh]">
                  <img
                    src={previewDataUrl}
                    alt="Certificate Preview"
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={downloadPreview}
                    className="px-4 py-2 bg-black text-white border border-black rounded hover:bg-white hover:text-black transition-colors"
                  >
                    Download PNG
                  </button>
                  <button
                    onClick={() => setPreviewDataUrl(null)}
                    className="px-4 py-2 bg-white text-black border border-black rounded hover:bg-black hover:text-white transition-colors"
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
