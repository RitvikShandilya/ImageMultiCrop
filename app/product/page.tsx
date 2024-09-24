"use client";

import React, { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage, Line, Circle, Rect } from "fabric"; 
import { Button } from "@/components/ui/button"; 

const FabricCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [verticalLine, setVerticalLine] = useState<Line | null>(null);
  const [horizontalLine, setHorizontalLine] = useState<Line | null>(null);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [rectangle, setRectangle] = useState<Rect | null>(null);
  const [dottedRect, setDottedRect] = useState<Rect | null>(null); 
  const [dottedAreaX, setDottedAreaX] = useState(175);
  const [isLeftAligned, setIsLeftAligned] = useState(true);
  const dottedAreaXRef = useRef(dottedAreaX);

  useEffect(() => {
    dottedAreaXRef.current = dottedAreaX;
  }, [dottedAreaX]);

  useEffect(() => {
    if (canvasRef.current) {
      const fabricCanvas = new Canvas(canvasRef.current, {
        backgroundColor: "#EDEDED",
        width: 600,
        height: 300,
      });
      setCanvas(fabricCanvas);

      const vLine = createVerticalCenterLine(fabricCanvas);
      const hLine = createHorizontalCenterLine(fabricCanvas);
      setVerticalLine(vLine);
      setHorizontalLine(hLine);

      const circleObj = new Circle({
        radius: 60,
        fill: "white",
        left: 50,
        top: 100,
        selectable: false,
      });
      
      const rectObj = new Rect({
        width: 120,
        height: 80,
        fill: "white",
        left: 50,
        top: 200,
        selectable: false,
      });

      const dottedRectangle = createDottedCenterRect(fabricCanvas);
      setDottedRect(dottedRectangle);
      fabricCanvas.add(circleObj);
      fabricCanvas.add(rectObj);
      setCircle(circleObj);
      setRectangle(rectObj);
      fabricCanvas.on("object:moving", () => highlightCenterLines(fabricCanvas));

      window.addEventListener("keydown", handleKeyDown(fabricCanvas));

      return () => {
        fabricCanvas.dispose();
        window.removeEventListener("keydown", handleKeyDown(fabricCanvas));
      };
    }
  }, []);

  const handleKeyDown = (fabricCanvas: Canvas) => (event: KeyboardEvent) => {
    if (event.key === "Backspace" || event.key === "Delete") {
      const activeObject = fabricCanvas.getActiveObject();
      if (activeObject && activeObject instanceof FabricImage) {
        fabricCanvas.remove(activeObject);
        fabricCanvas.renderAll();
      }
    }
  };

  const highlightCenterLines = (fabricCanvas: Canvas) => {
    const canvasCenterX = dottedAreaXRef.current;
    const canvasCenterY = fabricCanvas.getHeight() / 2;

    fabricCanvas.forEachObject((obj) => {
      if (obj instanceof FabricImage) {
        const objCenterX = obj.left! + (obj.width! * obj.scaleX!) / 2;
        const objCenterY = obj.top! + (obj.height! * obj.scaleY!) / 2;

        if (Math.abs(objCenterX - canvasCenterX) < 20) {
          obj.set({ left: canvasCenterX - (obj.width! * obj.scaleX!) / 2 });
        }

        if (Math.abs(objCenterY - canvasCenterY) < 20) {
          obj.set({ top: canvasCenterY - (obj.height! * obj.scaleY!) / 2 });
        }
      }
    });

    fabricCanvas.renderAll();
  };

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

  const createDottedCenterRect = (fabricCanvas: Canvas) => {
    const canvasCenterX = fabricCanvas.getWidth() / 2;
    const canvasCenterY = fabricCanvas.getHeight() / 2;

    const rectWidth = 250;
    const rectHeight = 250;

    const dottedRect = new Rect({
      left: canvasCenterX - rectWidth / 2,
      top: canvasCenterY - rectHeight / 2,
      width: rectWidth,
      height: rectHeight,
      stroke: "black",
      strokeWidth: 2,
      fill: "transparent", 
      strokeDashArray: [5, 5], 
      selectable: false,
      evented: false,
    });

    fabricCanvas.add(dottedRect);
    return dottedRect;
  };

  const bringToFront = (object: any, fabricCanvas: Canvas | null) => {
    if (fabricCanvas && object) {
      fabricCanvas.remove(object); // Remove the object first
      fabricCanvas.add(object);    // Add it back to the canvas, which places it on top
      fabricCanvas.renderAll();    // Re-render the canvas
    }
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
  
              if (dottedRect) {
                const dottedRectBounds = {
                  left: dottedRect.left!,
                  top: dottedRect.top!,
                  right: dottedRect.left! + dottedRect.width!,
                  bottom: dottedRect.top! + dottedRect.height!,
                };
  
                const imgWidth = imgInstance.width! * imgInstance.scaleX!;
                const imgHeight = imgInstance.height! * imgInstance.scaleY!;
  
                imgInstance.set({
                  left: Math.max(
                    dottedRectBounds.left,
                    Math.min(100, dottedRectBounds.right - imgWidth)
                  ),
                  top: Math.max(
                    dottedRectBounds.top,
                    Math.min(100, dottedRectBounds.bottom - imgHeight)
                  ),
                });
              }
  
              canvas.add(imgInstance);
              canvas.setActiveObject(imgInstance);
  
              bringToFront(circle, canvas);
              bringToFront(rectangle, canvas);
  
              canvas.renderAll();
            }
          };
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const updateDottedRectPosition = (fabricCanvas: Canvas) => {
    if (dottedRect) {
      const canvasCenterX = fabricCanvas.getWidth() / 2;
      const canvasCenterY = fabricCanvas.getHeight() / 2;

      dottedRect.set({
        left: canvasCenterX - 125, 
        top: canvasCenterY - 125,   
      });
      fabricCanvas.renderAll();
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

      if (verticalLine && horizontalLine) {
        canvas.remove(verticalLine);
        canvas.remove(horizontalLine);
      }
      const vLine = createVerticalCenterLine(canvas);
      const hLine = createHorizontalCenterLine(canvas);
      setVerticalLine(vLine);
      setHorizontalLine(hLine);

      updateDottedRectPosition(canvas);
    }
  };

  const toggleLayout = () => {
    if (canvas && circle && rectangle && dottedRect && verticalLine) {
      const alignmentPosition = isLeftAligned ? 50 : canvas.getWidth() - 150; 

      circle.set({ left: alignmentPosition, top: 20 });
      rectangle.set({ left: alignmentPosition, top: 180 });

      const canvasCenterX = canvas.getWidth() / 2;
      const offset = 50;
      const dottedRectLeftPosition = isLeftAligned
        ? canvasCenterX + offset - 50
        : canvasCenterX - 200 - offset;
  
      dottedRect.set({
        left: dottedRectLeftPosition,
      });

      const dottedRectCenterX = dottedRect.left! + dottedRect.width! / 2;
      verticalLine.set({
        x1: dottedRectCenterX,
        x2: dottedRectCenterX,
      });
      setDottedAreaX(dottedRectCenterX);
      highlightCenterLines(canvas);
      setIsLeftAligned(!isLeftAligned);
      canvas.renderAll();
    }
  };

  const downloadImage = () => {
    if (canvas) {
      // Hide non-image elements
      const objectsToHide = [circle, rectangle, verticalLine, horizontalLine, dottedRect];
      objectsToHide.forEach((obj) => obj && obj.set({ visible: false }));
      canvas.renderAll();

      // Get the data URL of the canvas
      const dataURL = canvas.toDataURL({
        format: "png",
        multiplier: 2, // For higher resolution
      });

      // Trigger download
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "canvas_image.png";
      link.click();

      // Restore visibility
      objectsToHide.forEach((obj) => obj && obj.set({ visible: true }));
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
        <Button onClick={downloadImage}>Download Image</Button> {/* Added button */}
      </div>

      <input
        type="file"
        accept="image/*"
        multiple 
        onChange={addImageToCanvas}
        className="border p-2"
      />

      <canvas ref={canvasRef} id="fabricCanvas" className="border" />
    </div>
  );
};

export default FabricCanvas;
