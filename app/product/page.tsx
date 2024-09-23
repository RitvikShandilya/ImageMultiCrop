"use client";

import React, { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage, Line, Circle, Rect } from "fabric"; // Import from 'fabric' v6 for browser
import { Button } from "@/components/ui/button"; // Assuming ShadCN button component path

const FabricCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [verticalLine, setVerticalLine] = useState<Line | null>(null);
  const [horizontalLine, setHorizontalLine] = useState<Line | null>(null);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [rectangle, setRectangle] = useState<Rect | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const fabricCanvas = new Canvas(canvasRef.current, {
        backgroundColor: "#EDEDED",
        width: 600,
        height: 300,
      });
      setCanvas(fabricCanvas);

      // Draw initial center lines
      const vLine = createVerticalCenterLine(fabricCanvas);
      const hLine = createHorizontalCenterLine(fabricCanvas);
      setVerticalLine(vLine);
      setHorizontalLine(hLine);

      // Add initial circle and rectangle
      const circleObj = new Circle({
        radius: 60,
        fill: "white",
        left: 100,
        top: 100,
        selectable: false,
      });

      const rectObj = new Rect({
        width: 120,
        height: 80,
        fill: "white",
        left: 200,
        top: 150,
        selectable: false,
      });

      fabricCanvas.add(circleObj);
      fabricCanvas.add(rectObj);

      setCircle(circleObj);
      setRectangle(rectObj);

      fabricCanvas.on("object:moving", () => highlightCenterLines(fabricCanvas));

      // Add keydown event listener for backspace deletion
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Backspace" || event.key === "Delete") {
          const activeObject = fabricCanvas.getActiveObject();
          if (activeObject && activeObject instanceof FabricImage) {
            fabricCanvas.remove(activeObject);
            fabricCanvas.renderAll();
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      // Clean up on component unmount
      return () => {
        fabricCanvas.dispose();
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, []);

  const createVerticalCenterLine = (fabricCanvas: Canvas) => {
    const canvasCenterX = fabricCanvas.getWidth() / 2;

    const verticalLine = new Line([canvasCenterX, 0, canvasCenterX, fabricCanvas.getHeight()], {
      stroke: "BLACK",
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
      stroke: "BLACK",
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
        const objCenterX = obj.left! + (obj.width! * obj.scaleX!) / 2;
        const objCenterY = obj.top! + (obj.height! * obj.scaleY!) / 2;

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
    if (event.target.files) {
      Array.from(event.target.files).forEach((file) => {
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
        reader.readAsDataURL(file);
      });
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

  const toggleLayout = () => {
    if (canvas && circle && rectangle) {
      const randomPosition = () => Math.random() * (canvas.getWidth() - 100);
      circle.set({ left: randomPosition(), top: randomPosition() });
      rectangle.set({ left: randomPosition(), top: randomPosition() });
      canvas.renderAll();
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
        <Button onClick={toggleLayout}>Toggle Layout</Button>
      </div>

      <input
        type="file"
        accept="image/*"
        multiple // Allow multiple file selection
        onChange={addImageToCanvas}
        className="border p-2"
      />

      <canvas ref={canvasRef} id="fabricCanvas" className="border" />
    </div>
  );
};

export default FabricCanvas;
