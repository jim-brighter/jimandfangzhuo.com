import { Component, OnInit } from '@angular/core';
import { ImageService } from '../../services/image.service';
import { PlannerEvent } from '../../types/event';

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
    let formData = new FormData();

    if (this.files.length > 0) {
      for (let i = 0; i < this.files.length; i++) {
        for (let j = 0; j < this.files[i].length; j++) {
          formData.append('images', this.files[i][j]);
        }
      }
      formData.append('event', new Blob([JSON.stringify(new PlannerEvent())], {
        type: 'application/json'
      }));

      this.imageService.uploadImages(formData).subscribe(data => {
        if (data.statusMessage === 'OK') {
          alert("Upload Success!");
        }
      });
    } else {
      console.log("no images selected");
    }
  }

}
