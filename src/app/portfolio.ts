import { Component, AfterViewInit, inject, CUSTOM_ELEMENTS_SCHEMA, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { inView, animate } from 'motion';
import { DataService } from './data.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-portfolio',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './portfolio.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PortfolioComponent implements AfterViewInit {
  dataService = inject(DataService);
  fb = inject(FormBuilder);
  router = inject(Router);
  platformId = inject(PLATFORM_ID);
  cdr = inject(ChangeDetectorRef);
  
  // Expose signals to template
  data = this.dataService.data;

  // Contact form
  contactForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    message: ['', Validators.required]
  });

  isSubmitting = false;
  submitSuccess = false;
  submitError = false;
  submitErrorMessage = '';

  isMobileMenuOpen = false;

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  async onSubmitMessage() {
    if (this.contactForm.invalid) return;

    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError = false;
    this.submitErrorMessage = '';
    this.cdr.detectChanges();

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.contactForm.value)
      });

      if (!response.ok) {
         let errMsg = 'Falha ao enviar mensagem.';
         try {
           const errData = await response.json();
           if (errData.error) errMsg = errData.error;
         } catch(e) {}
         throw new Error(errMsg);
      }

      this.submitSuccess = true;
      this.contactForm.reset();
    } catch (e: any) {
      this.submitError = true;
      this.submitErrorMessage = e.message || 'Erro ao enviar a mensagem. Tente novamente.';
      console.error(e);
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const sections = document.querySelectorAll('.animate-section');
      sections.forEach((section) => {
        section.setAttribute('style', 'opacity: 0; transform: translateY(20px)');
        inView(section, () => {
          animate(
            section, 
            { opacity: [0, 1], y: [20, 0] },
            { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
          );
          return () => {}; 
        }, { margin: '-50px' });
      });
    }
  }
}
