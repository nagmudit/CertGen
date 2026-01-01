"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric"; // v6 import
import { useAppStore } from "@/lib/store";

export default function CertificateEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const setTemplateJson = useAppStore((state) => state.setTemplateJson);

  useEffect(() => {
    if (canvasRef.current && !fabricCanvas) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: "#ffffff",
      });
      setFabricCanvas(canvas);

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
        fill: "blue",
      });
      canvas.add(namePlaceholder);

      return () => {
        canvas.dispose();
      };
    }
  }, [canvasRef, fabricCanvas]);

  const addText = () => {
    if (fabricCanvas) {
      const text = new fabric.IText("New Text", {
        left: 100,
        top: 100,
        fontFamily: "Arial",
        fontSize: 20,
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
    }
  };

  const saveTemplate = () => {
    if (fabricCanvas) {
      const json = fabricCanvas.toJSON();
      setTemplateJson(json);
      alert("Template saved!");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50">
      <h2 className="text-xl font-bold">1. Design Certificate</h2>
      <div className="border shadow-sm">
        <canvas ref={canvasRef} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={addText}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Text
        </button>
        <button
          onClick={saveTemplate}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Save Template
        </button>
      </div>
      <p className="text-sm text-gray-500">
        Use <code>{`{{variable}}`}</code> syntax for dynamic fields.
      </p>
    </div>
  );
}
