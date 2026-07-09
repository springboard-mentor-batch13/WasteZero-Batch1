import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

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
  registeredEmail: string = '';

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required)
  });

  registerForm = new FormGroup({
    fullName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    username: new FormControl('', Validators.required),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', Validators.required),
    role: new FormControl('volunteer', Validators.required) // Initialized as lowercase
  });

  constructor(private router: Router, private authService: AuthService) {}

  switchTab(tab: 'login' | 'register') { this.activeTab = tab; }

  onLogin() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (res: any) => {
          // 1. Save the token
          this.authService.setToken(res.data.accessToken);
          
          // 2. Save the full user object returned by the API
          if (res.data.user) {
            this.authService.setUser(res.data.user);
          }

          // 3. Navigate to the profile page
          this.router.navigate(['/profile']);
        },
        error: (err) => alert(err.error?.message || 'Login failed')
      });
    } else {
      // Show validation errors if form is invalid
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

    // Mapping 'fullName' to 'name' for backend compatibility
    const { confirmPassword, fullName, username, ...rest } = this.registerForm.value;
    const userData = { ...rest, name: fullName };

    this.authService.register(userData).subscribe({
      next: (response) => {
        this.registeredEmail = userData.email as string;
        this.showOtpModal = true;
      },
      error: (err) => {
        const errorMessage = err.error?.errors?.[0] || err.error?.message || 'Registration failed.';
        alert(errorMessage);
      }
    });
  }

  closeOtpModal() { this.showOtpModal = false; this.otpValue = ''; }

  submitRegistrationOtp() {
    this.authService.verifyEmail(this.registeredEmail, this.otpValue).subscribe({
      next: () => {
        alert('Verified successfully!');
        this.closeOtpModal();
        this.registerForm.reset({ role: 'volunteer' });
        this.switchTab('login');
      },
      error: (err) => alert(err.error?.message || 'Invalid OTP')
    });
  }
}