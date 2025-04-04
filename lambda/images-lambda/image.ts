interface IImage {
  imageId: string | null
  s3Region: string | null
  s3Bucket: string | null
  s3ObjectKey: string | null

  validateNewImage(): boolean
}

export type Image = IImage

export class PlannerImage implements Image {
  imageId: string | null
  s3Region: string | null
  s3Bucket: string | null
  s3ObjectKey: string | null

  constructor(json: Image) {
    this.imageId = json.imageId || null
    this.s3Region = process.env.AWS_REGION || 'us-east-1'
    this.s3Bucket = process.env.BUCKET_NAME || 'jimandfangzhuo.com-images'
    this.s3ObjectKey = json.s3ObjectKey || null

  }

  validateNewImage(): boolean {
    return this.s3ObjectKey != undefined && this.s3ObjectKey != null
  }
}
