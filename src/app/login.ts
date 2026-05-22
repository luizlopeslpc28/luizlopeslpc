import { Component, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginComponent {
  fb = inject(FormBuilder);
  router = inject(Router);
  http = inject(HttpClient);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  isLoggingIn = false;
  loginError = '';

  async login() {
    if (this.loginForm.invalid) return;
    this.isLoggingIn = true;
    this.loginError = '';
    
    try {
      await firstValueFrom(this.http.post<any>('/api/login', this.loginForm.value, { withCredentials: true }));
      this.router.navigate(['/admin']);
    } catch (e: any) {
      this.loginError = e.error?.error || e.message || 'Erro no login.';
    } finally {
      this.isLoggingIn = false;
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
