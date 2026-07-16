import { OpportunityService } from '../../../services/opportunity.service';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';

function futureDateValidator(
  control: AbstractControl
): ValidationErrors | null {

  if (!control.value) {
    return null;
  }

  const selectedDate = new Date(control.value);

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return selectedDate > today
    ? null
    : { pastDate: true };

}

@Component({
  selector: 'app-create-opportunity',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-opportunity.html',
  styleUrls: ['./create-opportunity.scss']
})
export class CreateOpportunityComponent {

  opportunityForm = new FormGroup({
    title: new FormControl('', Validators.required),

    description: new FormControl('', Validators.required),

    applicationDeadline: new FormControl(
  '',
  [Validators.required, futureDateValidator]
),

    durationValue: new FormControl('', Validators.required),

    durationUnit: new FormControl('hours', Validators.required),

    city: new FormControl('', Validators.required),
    
    state: new FormControl('', Validators.required),

    requiredSkills: new FormControl('', Validators.required),

    maxVolunteers: new FormControl(0)
  });
  constructor(private opportunityService: OpportunityService) {}

  onSubmit() {

  if (this.opportunityForm.invalid) {
    this.opportunityForm.markAllAsTouched();
    return;
  }

  const formValue = this.opportunityForm.value;

  const payload = {
    title: formValue.title,
    description: formValue.description,

    location: {
      city: formValue.city,
      state: formValue.state
    },

    duration: {
      value: Number(formValue.durationValue),
      unit: formValue.durationUnit
    },

    requiredSkills: formValue.requiredSkills
      ? formValue.requiredSkills
          .split(',')
          .map(skill => skill.trim())
      : [],

    applicationDeadline: formValue.applicationDeadline,

    maxVolunteers: Number(formValue.maxVolunteers)
  };

  this.opportunityService.createOpportunity(payload).subscribe({

    next: (response) => {
      console.log('Opportunity created successfully', response);
      this.opportunityForm.reset();
    },

    error: (err) => {
      console.error(err);
      alert('Failed to create opportunity.');
    }

  });

}

}