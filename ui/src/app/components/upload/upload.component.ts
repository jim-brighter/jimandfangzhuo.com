import { Component } from '@angular/core';
import { ImageService } from '../../services/image.service';
import { ImageUploadRequest } from 'src/app/types/image-upload-request';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {

  files: FileList[] = [];

  constructor(private imageService: ImageService) { }

  onFileChange(event: any) {
    this.files = [];
    this.files.push(event.target.files);
  }

  upload() {
    if (this.files.length > 0) {
      const imageRequest = new ImageUploadRequest();

      const reader = new FileReader();
      reader.onloadend = () => {
        imageRequest.imageData = reader.result as string;
        this.imageService.uploadImages(imageRequest).subscribe(data => {
          if (data.statusMessage === 'OK') {
            alert("Upload Success!");
          }
        });
      }
      reader.readAsDataURL(this.files[0][0]);
    } else {
      console.log("no images selected");
    }
  }

}
