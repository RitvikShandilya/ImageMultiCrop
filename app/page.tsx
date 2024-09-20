'use client'
import React, { useRef, useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"

interface Box {
  x: number
  y: number
  width: number
  height: number
}

interface ExtractedImage {
  dataUrl: string
  width: number
  height: number
}

export default function ImageManipulator() {
  const [boxes, setBoxes] = useState<Box[]>([
    { x: 50, y: 50, width: 100, height: 100 },
    { x: 200, y: 50, width: 100, height: 100 }
  ])
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([])
  const [imageLoaded, setImageLoaded] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imageLoaded) {
      drawBoxes()
    }
  }, [imageLoaded, boxes])

  const drawBoxes = () => {
    if (canvasRef.current && imageRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        ctx.drawImage(imageRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        boxes.forEach((box) => {
          ctx.strokeStyle = 'red'
          ctx.lineWidth = 2
          ctx.strokeRect(box.x, box.y, box.width, box.height)
          // Remove the fill to avoid coloring the rectangles
          // ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'
          // ctx.fillRect(box.x, box.y, box.width, box.height)
        })
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const index = boxes.findIndex(box => 
        x >= box.x && x <= box.x + box.width && 
        y >= box.y && y <= box.y + box.height
      )
      if (index !== -1) {
        setDraggingIndex(index)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingIndex !== null) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setBoxes(prevBoxes => prevBoxes.map((box, index) => 
          index === draggingIndex ? { ...box, x: x - box.width / 2, y: y - box.height / 2 } : box
        ))
      }
    }
  }

  const handleMouseUp = () => {
    setDraggingIndex(null)
  }

  const extractImages = () => {
    if (imageRef.current && canvasRef.current) {
      const imgWidth = imageRef.current.naturalWidth
      const imgHeight = imageRef.current.naturalHeight
      const canvasWidth = canvasRef.current.width
      const canvasHeight = canvasRef.current.height

      const scaleX = imgWidth / canvasWidth
      const scaleY = imgHeight / canvasHeight

      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = imgWidth
      tempCanvas.height = imgHeight
      const tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) {
        tempCtx.drawImage(imageRef.current, 0, 0, imgWidth, imgHeight)
        const extractedImgs = boxes.map(box => {
          const sx = box.x * scaleX
          const sy = box.y * scaleY
          const sWidth = box.width * scaleX
          const sHeight = box.height * scaleY
          const imageData = tempCtx.getImageData(sx, sy, sWidth, sHeight)
          const canvas = document.createElement('canvas')
          canvas.width = sWidth
          canvas.height = sHeight
          const context = canvas.getContext('2d')
          if (context) {
            context.putImageData(imageData, 0, 0)
            const dataUrl = canvas.toDataURL()
            return {
              dataUrl: dataUrl,
              width: sWidth,
              height: sHeight
            }
          }
          return {
            dataUrl: '',
            width: sWidth,
            height: sHeight
          }
        })
        setExtractedImages(extractedImgs)
      }
    }
  }

  const addTextOverlay = async () => {
    const updatedImages = await Promise.all(extractedImages.map(async (imgData, index) => {
      return new Promise<ExtractedImage>((resolve) => {
        const img = new Image()
        img.src = imgData.dataUrl
        const canvas = document.createElement('canvas')
        canvas.width = imgData.width
        canvas.height = imgData.height
        const ctx = canvas.getContext('2d')
        img.onload = () => {
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            ctx.font = '20px Arial'
            ctx.fillStyle = 'black'
            ctx.textAlign = 'center'
            ctx.fillText(`Image ${index + 1}`, canvas.width / 2, 30)
            const newDataUrl = canvas.toDataURL()
            resolve({
              dataUrl: newDataUrl,
              width: imgData.width,
              height: imgData.height
            })
          } else {
            resolve(imgData)
          }
        }
      })
    }))
    setExtractedImages(updatedImages)
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <div className="relative">
        <img
          ref={imageRef}
          src="/img.png" // Ensure the path is correct
          alt="Sample Image"
          onLoad={() => {
            setImageLoaded(true)
            if (canvasRef.current && imageRef.current) {
              const canvas = canvasRef.current
              const image = imageRef.current
              canvas.width = 400 // Set desired canvas width
              canvas.height = 300 // Set desired canvas height
              drawBoxes()
            }
          }}
          style={{ display: 'none' }} // Hide the image element
        />
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="border border-gray-300"
        />
      </div>
      <Button onClick={extractImages}>Extract Images</Button>
      <Button onClick={addTextOverlay}>Add Text Overlay</Button>
      <div className="flex space-x-4">
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
  )
}
