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

  useEffect(() => {
    if (canvasRef.current && !canvasInstance.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
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

      return () => {
        canvas.dispose();
        canvasInstance.current = null;
      };
    }
  }, []);

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

  const saveTemplate = () => {
    if (canvasInstance.current) {
      const json = canvasInstance.current.toJSON();
      setTemplateJson(json);
      alert("Template saved!");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-black rounded-lg bg-white">
      <h2 className="text-xl font-bold">1. Design Certificate</h2>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 p-4 border border-black rounded bg-gray-50 items-center">
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

      <div className="border border-black shadow-sm overflow-hidden">
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
