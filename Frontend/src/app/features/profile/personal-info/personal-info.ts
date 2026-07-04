import { Component, EventEmitter, Output } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms'; // <-- Imported here

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [ReactiveFormsModule], // <-- Added to imports array
  templateUrl: './personal-info.html',
  styleUrls: ['./personal-info.scss']
})
export class PersonalInfoComponent {
  @Output() infoUpdate = new EventEmitter<any>();

  profileForm = new FormGroup({
    fullName: new FormControl(''),
                              email: new FormControl({value: '', disabled: true}),
                              location: new FormControl(''),
                              skills: new FormControl(''),
                              bio: new FormControl('')
  });

  onSubmit() {
    this.infoUpdate.emit(this.profileForm.getRawValue());
  }
}
