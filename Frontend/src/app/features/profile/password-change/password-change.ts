import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-password-change',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './password-change.html',
  styleUrls: ['./password-change.scss']
})
export class PasswordChangeComponent {
  @Output() passwordUpdate = new EventEmitter<any>();

  // Modal State
  showOtpModal: boolean = false;
  otpValue: string = '';

  passwordForm = new FormGroup({
    currentPassword: new FormControl(''),
    newPassword: new FormControl(''),
    confirmPassword: new FormControl('')
  });

  /**
   * Triggered when the user clicks the initial "Change Password" button.
   * Opens the OTP modal instead of submitting immediately.
   */
  onSubmit() {
    if (this.passwordForm.valid) {
      this.showOtpModal = true;
      // Note: Trigger your backend service to send the OTP to the email here
      console.log('OTP sent to registered email.');
    }
  }

  /**
   * Closes the OTP modal and resets the input.
   */
  closeOtpModal() {
    this.showOtpModal = false;
    this.otpValue = '';
  }

  /**
   * Submits the OTP for verification and emits the final payload.
   */
  submitOtp() {
    if (!this.otpValue) {
      alert('Please enter the OTP');
      return;
    }

    console.log('Verifying OTP:', this.otpValue);
    
    // Emit the form values along with the entered OTP
    this.passwordUpdate.emit({
      ...this.passwordForm.value,
      otp: this.otpValue
    });

    // Close the modal and optionally reset the form
    this.closeOtpModal();
    this.passwordForm.reset();
  }
}