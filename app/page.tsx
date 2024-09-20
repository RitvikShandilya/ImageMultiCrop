"use client";
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ExtractedImage {
  dataUrl: string;
  width: number;
  height: number;
}

export default function ImageManipulator() {
  const [boxes, setBoxes] = useState<Box[]>([
    { x: 1, y: 100, width: 497, height: 150 }, // First box
    { x: 100, y: 50, width: 300, height: 400 }, // Second box
  ]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageLoaded) {
      drawBoxes();
    }
  }, [imageLoaded, boxes]);

  const drawBoxes = () => {
    if (canvasRef.current && imageRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(
          imageRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        boxes.forEach((box) => {
          ctx.strokeStyle = "red";
          ctx.lineWidth = 2;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          // Remove the fill to avoid coloring the rectangles
          // ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'
          // ctx.fillRect(box.x, box.y, box.width, box.height)
        });
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const index = boxes.findIndex(
        (box) =>
          x >= box.x &&
          x <= box.x + box.width &&
          y >= box.y &&
          y <= box.y + box.height
      );
      if (index !== -1) {
        setDraggingIndex(index);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingIndex !== null) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
  
        setBoxes((prevBoxes) =>
          prevBoxes.map((box, index) => {
            if (index === draggingIndex) {
              const newX = x - box.width / 2;
              const newY = y - box.height / 2;
  
              // Check boundaries
              const clampedX = Math.max(0, Math.min(newX, canvasRef.current!.width - box.width));
              const clampedY = Math.max(0, Math.min(newY, canvasRef.current!.height - box.height));
  
              return { ...box, x: clampedX, y: clampedY };
            }
            return box;
          })
        );
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingIndex(null);
  };

  const extractImages = () => {
    if (imageRef.current && canvasRef.current) {
      const imgWidth = imageRef.current.naturalWidth;
      const imgHeight = imageRef.current.naturalHeight;
      const canvasWidth = canvasRef.current.width;
      const canvasHeight = canvasRef.current.height;

      const scaleX = imgWidth / canvasWidth;
      const scaleY = imgHeight / canvasHeight;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = imgWidth;
      tempCanvas.height = imgHeight;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx) {
        tempCtx.drawImage(imageRef.current, 0, 0, imgWidth, imgHeight);
        const extractedImgs = boxes.map((box) => {
          const sx = box.x * scaleX;
          const sy = box.y * scaleY;
          const sWidth = box.width * scaleX;
          const sHeight = box.height * scaleY;
          const imageData = tempCtx.getImageData(sx, sy, sWidth, sHeight);
          const canvas = document.createElement("canvas");
          canvas.width = sWidth;
          canvas.height = sHeight;
          const context = canvas.getContext("2d");
          if (context) {
            context.putImageData(imageData, 0, 0);
            const dataUrl = canvas.toDataURL();
            return {
              dataUrl: dataUrl,
              width: sWidth,
              height: sHeight,
            };
          }
          return {
            dataUrl: "",
            width: sWidth,
            height: sHeight,
          };
        });
        setExtractedImages(extractedImgs);
      }
    }
  };

  const addTextOverlay = async () => {
    const updatedImages = await Promise.all(
      extractedImages.map(async (imgData, index) => {
        return new Promise<ExtractedImage>((resolve) => {
          const img = new Image();
          img.src = imgData.dataUrl;
          const canvas = document.createElement("canvas");
          canvas.width = imgData.width;
          canvas.height = imgData.height;
          const ctx = canvas.getContext("2d");
  
          img.onload = () => {
            if (ctx) {
              // Draw the image
              ctx.drawImage(img, 0, 0);
  
              // Define circle properties
              const circleRadius = 100; // Adjust the size as needed
              const circleX = 120;
              const circleY = 150; // Position the circle at the top
  
              // Draw white circle
              ctx.beginPath();
              ctx.arc(circleX, circleY, circleRadius, 0, 2 * Math.PI, false);
              ctx.fillStyle = "white";
              ctx.fill();
              ctx.lineWidth = 5;
              ctx.strokeStyle = "#6172f3"; // Optional: Add a border to the circle
              ctx.stroke();
  
              // Add text inside the circle
              ctx.font = "20px Arial";
              ctx.fillStyle = "black";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(`Sample Layout text ${index + 1}`, circleX, circleY);
  
              // Convert canvas to data URL
              const newDataUrl = canvas.toDataURL();
              resolve({
                dataUrl: newDataUrl,
                width: imgData.width,
                height: imgData.height,
              });
            } else {
              resolve(imgData);
            }
          };
        });
      })
    );
    setExtractedImages(updatedImages);
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <div className="relative">
        <img
          ref={imageRef}
          src="/img.webp" // Ensure the path is correct
          alt="Sample Image"
          onLoad={() => {
            setImageLoaded(true);
            if (canvasRef.current && imageRef.current) {
              const canvas = canvasRef.current;
              const image = imageRef.current;
              canvas.width = 500; // Set desired canvas width
              canvas.height = 500;
              drawBoxes();
            }
          }}
          style={{ display: "none" }} // Hide the image element
        />
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="border border-gray-300"
        />
      </div>
      <Button onClick={extractImages}>Extract Images</Button>
      <Button onClick={addTextOverlay}>Add Text Overlay</Button>
      <div className="space-y-4">
        {extractedImages.map((imgData, index) => (
          <img
            key={index}
            src={imgData.dataUrl}
            width={imgData.width}
            height={imgData.height}
            className="border border-gray-300"
          />
        ))}
      </div>
    </div>
  );
}
