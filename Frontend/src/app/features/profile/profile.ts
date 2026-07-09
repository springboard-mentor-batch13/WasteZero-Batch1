import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { PersonalInfoComponent } from './personal-info/personal-info';
import { PasswordChangeComponent } from './password-change/password-change';
import { MobileBottomNav } from '../../shared/mobile-bottom-nav/mobile-bottom-nav';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    Sidebar,
    PersonalInfoComponent,
    PasswordChangeComponent,
    MobileBottomNav
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile {

  activeTab: 'profile' | 'password' = 'profile';
  isSidebarOpen = false;
  isDropdownOpen = false;

  constructor(private router: Router) {}

  setActiveTab(tab: 'profile' | 'password'): void {
    this.activeTab = tab;
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }


  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout(): void {
    console.log('Logging out...');
    this.router.navigate(['/auth']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;
    if (this.isDropdownOpen && !targetElement.closest('.user-dropdown')) {
      this.isDropdownOpen = false;
    }
  }


  onInfoHandoff(event: unknown): void {
    console.log('Personal Info Form Submitted:', event);
  }

  onPasswordHandoff(event: unknown): void {
    console.log('Password Change Form Submitted:', event);
  }

}