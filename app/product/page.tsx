"use client";

import React, { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage, Line } from "fabric"; // Import from 'fabric' v6 for browser
import { Button } from "@/components/ui/button"; // Assuming ShadCN button component path

const FabricCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [verticalLine, setVerticalLine] = useState<Line | null>(null);
  const [horizontalLine, setHorizontalLine] = useState<Line | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const fabricCanvas = new Canvas(canvasRef.current, {
        backgroundColor: "blue",
        width: 600,
        height: 300,
      });
      setCanvas(fabricCanvas);

      // Draw initial center lines
      const vLine = createVerticalCenterLine(fabricCanvas);
      const hLine = createHorizontalCenterLine(fabricCanvas);
      setVerticalLine(vLine);
      setHorizontalLine(hLine);

      fabricCanvas.on("object:moving", () => highlightCenterLines(fabricCanvas));

      // Clean up on component unmount
      return () => {
        fabricCanvas.dispose();
      };
    }
  }, []);

  const createVerticalCenterLine = (fabricCanvas: Canvas) => {
    const canvasCenterX = fabricCanvas.getWidth() / 2;

    const verticalLine = new Line([canvasCenterX, 0, canvasCenterX, fabricCanvas.getHeight()], {
      stroke: "red",
      strokeWidth: 2,
      selectable: false,
      evented: false,
    });

    fabricCanvas.add(verticalLine);
    fabricCanvas.renderAll();

    return verticalLine;
  };

  const createHorizontalCenterLine = (fabricCanvas: Canvas) => {
    const canvasCenterY = fabricCanvas.getHeight() / 2;

    const horizontalLine = new Line([0, canvasCenterY, fabricCanvas.getWidth(), canvasCenterY], {
      stroke: "red",
      strokeWidth: 2,
      selectable: false,
      evented: false,
    });

    fabricCanvas.add(horizontalLine);
    fabricCanvas.renderAll();

    return horizontalLine;
  };

  const highlightCenterLines = (fabricCanvas: Canvas) => {
    const canvasCenterX = fabricCanvas.getWidth() / 2;
    const canvasCenterY = fabricCanvas.getHeight() / 2;

    fabricCanvas.forEachObject((obj) => {
      if (obj instanceof FabricImage) {
        const objCenterX = obj.left! + obj.width! * obj.scaleX! / 2;
        const objCenterY = obj.top! + obj.height! * obj.scaleY! / 2;

        if (Math.abs(objCenterX - canvasCenterX) < 5) {
          obj.set({ left: canvasCenterX - (obj.width! * obj.scaleX!) / 2 });
        }

        if (Math.abs(objCenterY - canvasCenterY) < 5) {
          obj.set({ top: canvasCenterY - (obj.height! * obj.scaleY!) / 2 });
        }
      }
    });

    fabricCanvas.renderAll();
  };

  const addImageToCanvas = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgElement = new Image();
        imgElement.src = e.target?.result as string;
        imgElement.onload = () => {
          const imgInstance = new FabricImage(imgElement, {
            left: 100,
            top: 100,
            selectable: true,
          });

          if (canvas) {
            const scaleFactor = (canvas.height * 0.4) / imgElement.height;
            imgInstance.scale(scaleFactor);

            canvas.add(imgInstance);
            canvas.setActiveObject(imgInstance);
            canvas.renderAll();
          }
        };
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const handleBackgroundSize = (size: "large" | "tall") => {
    if (canvas) {
      if (size === "large") {
        canvas.setWidth(600);
        canvas.setHeight(300);
      } else {
        canvas.setWidth(300);
        canvas.setHeight(600);
      }
      canvas.renderAll();

      // Redraw center lines after resizing the canvas
      if (verticalLine && horizontalLine) {
        canvas.remove(verticalLine);
        canvas.remove(horizontalLine);
      }
      const vLine = createVerticalCenterLine(canvas);
      const hLine = createHorizontalCenterLine(canvas);
      setVerticalLine(vLine);
      setHorizontalLine(hLine);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex space-x-2">
        <Button onClick={() => handleBackgroundSize("large")}>
          Set 600 x 300 Background
        </Button>
        <Button onClick={() => handleBackgroundSize("tall")}>
          Set 300 x 600 Background
        </Button>
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={addImageToCanvas}
        className="border p-2"
      />

      <canvas ref={canvasRef} id="fabricCanvas" className="border" />
    </div>
  );
};

export default FabricCanvas;
