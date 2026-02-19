import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgIf } from '@angular/common';
@Component({
    selector: 'app-user-image-picker',
    imports: [NgIf],
    templateUrl: './user-image-picker.component.html'
})
export class UserImagePickerComponent implements OnInit {
    @Input()
    id!: string;
    @Input()
    imageUrl!: string;
    @Input()
    defaultImage: string = 'assets/images/tenant/logo_url_default.png';
    @Input()
    wide = false;
    @Output()
    onImageSelected = new EventEmitter<File>();
    @Output()
    onClear = new EventEmitter<string>();
    selectedFile?: File;
    selectedImage?: string;
    ngOnInit(): void {
        this.selectedImage = this.imageUrl || this.defaultImage;
    }
    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (e: any) => {
            this.selectedImage = e.target.result;
        };
        reader.readAsDataURL(file);
        this.selectedFile = file;
        this.onImageSelected.emit(file);
    }
    deleteImage(event?: Event) {
        event?.stopPropagation();
        this.onClear.emit(this.id);
        this.selectedFile = undefined;
        this.selectedImage = this.defaultImage;
        this.imageUrl = this.defaultImage;
    }
}
