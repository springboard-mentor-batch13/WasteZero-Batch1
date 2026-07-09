import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  FormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './auth.html',
  styleUrls: ['./auth.scss']
})
export class AuthComponent {

  activeTab: 'login' | 'register' = 'login';

  showOtpModal = false;
  otpValue = '';
  passwordMismatch = false;

  loginForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),
    password: new FormControl('', Validators.required)
  });

  registerForm = new FormGroup({
    fullName: new FormControl('', Validators.required),
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),
    username: new FormControl('', Validators.required),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8)
    ]),
    confirmPassword: new FormControl('', Validators.required),
    role: new FormControl('volunteer', Validators.required)
  });

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  switchTab(tab: 'login' | 'register') {
    this.activeTab = tab;
  }

  onLogin() {

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authService.login(this.loginForm.value).subscribe({

      next: () => {

        alert('Login Successful');

        this.router.navigate(['/profile']);

      },

      error: (error: HttpErrorResponse) => {

        alert(error.error?.message || 'Invalid email or password');

      }

    });

  }

  onRegister() {

  this.passwordMismatch = false;

  if (this.registerForm.invalid) {
    this.registerForm.markAllAsTouched();
    return;
  }

  if (
    this.registerForm.value.password !==
    this.registerForm.value.confirmPassword
  ) {
    this.passwordMismatch = true;
    return;
  }

  const registerData = {
    name: this.registerForm.value.fullName,
    email: this.registerForm.value.email,
    password: this.registerForm.value.password,
    role: this.registerForm.value.role
  };

  this.authService.register(registerData).subscribe({

    next: (response: any) => {
      alert(response.message || 'OTP sent to your email');
      this.showOtpModal = true;
    },

    error: (error) => {
      alert(error.error?.message || 'Registration failed');
    }

  });

}

  submitRegistrationOtp() {

  if (!this.otpValue) {
    alert('Please enter OTP');
    return;
  }

  this.authService.verifyEmail(
    this.registerForm.value.email!,
    this.otpValue
  ).subscribe({

    next: () => {

      alert('Registration Successful');

      this.closeOtpModal();

      this.registerForm.reset({
  role: 'volunteer'
});

      this.switchTab('login');
    },

    error: (error) => {
      alert(error.error?.message || 'Invalid OTP');
    }

  });

}

closeOtpModal() {
  this.showOtpModal = false;
  this.otpValue = '';
}

}
