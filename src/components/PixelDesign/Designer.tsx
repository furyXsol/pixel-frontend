import { useEffect, useState } from 'react'
interface DesignerProps {
  color: string
  drawType: 'draw' | 'paint'
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}
const Designer:React.FC<DesignerProps>= ({
  color,
  drawType,
  canvasRef,
}) => {
  const [isDrawing, setIsDrawing] = useState(false)
  const GRID_SIZE = 32
  const DIMENSION = 448 / GRID_SIZE
  const newArray = [0, 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]
  const [pixels, setPixels] = useState<string[][]>([])

  const colorCell = (row: number, col: number, color: string) => {
    const gridArray = pixels.slice()
    gridArray[row][col] = color
    setPixels(gridArray);
  }

  const getPixel = (row: number, col: number): string => {
    return pixels[row][col]
  }

  useEffect(() => {
    const gridArray = []
    for (let i = 0; i < GRID_SIZE; i++) {
      const row = []
      for (let j = 0; j<GRID_SIZE; j++) {
        row.push('#ffffff')
      }
      gridArray.push(row)
    }
    setPixels(gridArray)
  }, [])

  return (
    <div className="relative w-[448px] h-[448px] mx-auto">
      <div className="absolute w-[448px] h-[448px] bg-white">
        {
          newArray.map((value, i) => {
            return <div
              key={`index-${i}`}
              className={`absolute top-0 w-[1px] bg-[#cccccc] h-[448px]`}
              style={{left: i*DIMENSION}}
              />
        })
        }
        {
          newArray.map((value, i) => {
            return <div
              key={`index-${i}`}
              className={`absolute left-0 w-[448px] bg-[#cccccc] h-[1px]`}
              style={{top: i * DIMENSION}}
              />
        })
        }
      </div>
      <canvas
        className="absolute"
        height="448"
        width="448"
        ref={canvasRef}
        onMouseDown={(e) => {
          if (e.button != 0) return
          const ctx = e.currentTarget.getContext("2d")
          if (ctx) {
            ctx.fillStyle = color
            if (drawType === 'paint') {
              const startX = Math.floor(e.nativeEvent.offsetX / DIMENSION)
              const startY = Math.floor(e.nativeEvent.offsetY / DIMENSION)
              for (
                let x = startX, y = startY, c = getPixel(x, y), pixelArray=[{ x, y, color: c}], l = 0;
                l < pixelArray.length; l++
              ) {
                ctx.fillRect( pixelArray[l].x * DIMENSION, pixelArray[l].y * DIMENSION, DIMENSION, DIMENSION)
                let newX = pixelArray[l].x - 1
                let newY = pixelArray[l].y
                if (
                  newX >= 0 &&
                  newY >= 0 &&
                  newX < GRID_SIZE &&
                  newY < GRID_SIZE &&
                  getPixel(newX, newY) === pixelArray[l].color &&
                  !pixelArray.some(pixel => pixel.x == newX && pixel.y === newY)
                ) {
                  pixelArray.push({
                    x: newX,
                    y: newY,
                    color: getPixel(newX, newY)
                  })
                }

                newX = pixelArray[l].x + 1
                newY = pixelArray[l].y
                if (
                  newX >= 0 &&
                  newY >= 0 &&
                  newX < GRID_SIZE &&
                  newY < GRID_SIZE &&
                  getPixel(newX, newY) === pixelArray[l].color &&
                  !pixelArray.some(pixel => pixel.x == newX && pixel.y === newY)
                ) {
                  pixelArray.push({
                    x: newX,
                    y: newY,
                    color: getPixel(newX, newY)
                  })
                }

                newX = pixelArray[l].x
                newY = pixelArray[l].y - 1
                if (
                  newX >= 0 &&
                  newY >= 0 &&
                  newX < GRID_SIZE &&
                  newY < GRID_SIZE &&
                  getPixel(newX, newY) === pixelArray[l].color &&
                  !pixelArray.some(pixel => pixel.x == newX && pixel.y === newY)
                ) {
                  pixelArray.push({
                    x: newX,
                    y: newY,
                    color: getPixel(newX, newY)
                  })
                }
                newX = pixelArray[l].x
                newY = pixelArray[l].y + 1
                if (
                  newX >= 0 &&
                  newY >= 0 &&
                  newX < GRID_SIZE &&
                  newY < GRID_SIZE &&
                  getPixel(newX, newY) === pixelArray[l].color &&
                  !pixelArray.some(pixel => pixel.x == newX && pixel.y === newY)
                ) {
                  pixelArray.push({
                    x: newX,
                    y: newY,
                    color: getPixel(newX, newY)
                  })
                }
                colorCell(pixelArray[l].x, pixelArray[l].y, color)
              }
            } else {
              setIsDrawing(true)
              const startX = Math.floor(e.nativeEvent.offsetX / DIMENSION)
              const startY = Math.floor(e.nativeEvent.offsetY / DIMENSION)
              ctx.fillRect( startX * DIMENSION, startY * DIMENSION, DIMENSION, DIMENSION)
              colorCell(startX, startY, color)
            }
          }
        }}
        onMouseMove={(e) => {
          // // only handle mouse moves when the mouse is already down.
          if (isDrawing && e.buttons > 0) {
          const ctx = e.currentTarget.getContext("2d")
            if (ctx) {
              ctx.fillStyle = color
              const startX = Math.floor(e.nativeEvent.offsetX / DIMENSION)
              const startY = Math.floor(e.nativeEvent.offsetY / DIMENSION)
              ctx.fillRect( startX * DIMENSION, startY * DIMENSION, DIMENSION, DIMENSION)
              colorCell(startX, startY, color)
            }
          }
        }}
        onMouseUp={() => {
          // end drawing.
          setIsDrawing(false)
        }}

      ></canvas>
    </div>
  )
}

export default Designer