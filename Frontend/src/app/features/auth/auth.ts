import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.scss']
})
export class AuthComponent {
  activeTab: 'login' | 'register' = 'login';

  showOtpModal: boolean = false;
  otpValue: string = '';
  passwordMismatch: boolean = false;

  loginForm = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  });

  registerForm = new FormGroup({
    fullName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    username: new FormControl('', Validators.required),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', Validators.required),
    role: new FormControl('Volunteer', Validators.required)
  });

  constructor(private router: Router) {}

  switchTab(tab: 'login' | 'register') {
    this.activeTab = tab;
  }

  onLogin() {
    if (this.loginForm.valid) {
      console.log('Login Payload:', this.loginForm.value);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  onRegister() {
    this.passwordMismatch = false;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.registerForm.value.password !== this.registerForm.value.confirmPassword) {
      this.passwordMismatch = true;
      return;
    }

    this.showOtpModal = true;
  }

  closeOtpModal() {
    this.showOtpModal = false;
    this.otpValue = '';
  }

  submitRegistrationOtp() {
    if (!this.otpValue) {
      alert('Please enter the OTP');
      return;
    }
    console.log('Registration complete for:', this.registerForm.value.email);
    this.closeOtpModal();
    this.registerForm.reset({ role: 'Volunteer' });
    this.switchTab('login');
  }
}