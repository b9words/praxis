import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

/**
 * POST /api/thumbnail/process
 * Process AI-generated image (Imagen/DALL-E): crop to 3:4 ratio and resize to 300x400
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl, targetWidth = 300, targetHeight = 400 } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      )
    }

    // Fetch image from AI-generated URL (Imagen/DALL-E)
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

    // Get image metadata to determine input dimensions
    const metadata = await sharp(imageBuffer).metadata()
    const inputWidth = metadata.width || 1024
    const inputHeight = metadata.height || 768

    // Calculate 3:4 aspect ratio crop dimensions
    // For any input size, maintain 3:4 ratio (width:height = 3:4)
    let cropWidth = inputWidth
    let cropHeight = Math.round(inputWidth * (4 / 3)) // height = width * (4/3)
    
    // If calculated height exceeds input, constrain by height instead
    if (cropHeight > inputHeight) {
      cropHeight = inputHeight
      cropWidth = Math.round(inputHeight * (3 / 4)) // width = height * (3/4)
    }

    // Center crop position
    const cropLeft = Math.floor((inputWidth - cropWidth) / 2)
    const cropTop = Math.floor((inputHeight - cropHeight) / 2)

    // Process with sharp:
    // 1. Crop to 3:4 aspect ratio (center gravity)
    // 2. Resize to 300x400
    const processedBuffer = await sharp(imageBuffer)
      .extract({
        left: cropLeft,
        top: cropTop,
        width: cropWidth,
        height: cropHeight,
      })
      .resize(targetWidth, targetHeight, {
        fit: 'fill',
        position: 'center',
      })
      .png()
      .toBuffer()

    // Return processed image as base64 data URI
    const base64 = processedBuffer.toString('base64')
    const dataUri = `data:image/png;base64,${base64}`

    return NextResponse.json({
      success: true,
      imageBuffer: dataUri,
      width: targetWidth,
      height: targetHeight,
    })
  } catch (error) {
    console.error('Error processing thumbnail image:', error)
    return NextResponse.json(
      {
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

