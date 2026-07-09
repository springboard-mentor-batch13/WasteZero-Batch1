import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, FormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';

// Custom validator to check if newPassword and confirmPassword match perfectly
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-password-change',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './password-change.html',
  styleUrls: ['./password-change.scss']
})
export class PasswordChangeComponent {
  showOtpModal: boolean = false;
  otpValue: string = '';
  
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  passwordForm = new FormGroup({
    currentPassword: new FormControl('', Validators.required),
    newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', Validators.required)
  }, { validators: passwordMatchValidator }); // Apply the custom validator to the whole form

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit() {
    if (this.passwordForm.invalid) return;

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const currentPassword = this.passwordForm.get('currentPassword')?.value;

    this.authService.initiatePasswordChange(currentPassword!).subscribe({
      next: () => {
        this.isLoading = false;
        this.showOtpModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Incorrect current password or server error.';
        this.cdr.detectChanges();
      }
    });
  }

  closeOtpModal() {
    this.showOtpModal = false;
    this.otpValue = '';
  }

  submitOtp() {
    if (!this.otpValue) {
      this.errorMessage = 'Please enter the OTP';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const newPassword = this.passwordForm.get('newPassword')?.value;

    this.authService.confirmPasswordChange(this.otpValue, newPassword!).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Password changed successfully!';
        this.closeOtpModal();
        this.passwordForm.reset();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid OTP. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }
}