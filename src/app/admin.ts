import { Component, inject, OnInit, effect, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormArray } from '@angular/forms';
import { DataService, AppData } from './data.service';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule],
  templateUrl: './admin.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminComponent implements OnInit {
  fb = inject(FormBuilder);
  dataService = inject(DataService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  http = inject(HttpClient);

  form!: FormGroup;
  
  saved = false;
  isSaving = false;
  saveError = '';

  constructor() {
    effect(() => {
      const data = this.dataService.data();
      if (data && this.form) {
        this.updateFormWithData(data);
      }
    });
  }

  async ngOnInit() {
    this.initEmptyForm();
    this.updateFormWithData(this.dataService.data());
  }

  initEmptyForm() {
    this.form = this.fb.group({
      config: this.fb.group({ name: [''] }),
      home: this.fb.group({ greeting: [''], headline: [''], description: [''], ctaLabel: [''] }),
      about: this.fb.group({ text1: [''], text2: [''], skills: [''] }),
      projects: this.fb.array([]),
      faqs: this.fb.array([]),
      socials: this.fb.array([]),
      contact: this.fb.group({ title: [''], description: [''], email: [''], footerText: [''] })
    });
  }

  updateFormWithData(data: AppData) {
    this.form.patchValue({
      config: data.config,
      home: data.home,
      about: { ...data.about, skills: data.about.skills.join(', ') },
      contact: data.contact,
    });
    
    this.projects.clear();
    data.projects.forEach(p => this.projects.push(this.createProjectGroup(p)));
    
    this.faqs.clear();
    data.faqs.forEach(f => this.faqs.push(this.createFaqGroup(f)));
    
    this.socials.clear();
    data.socials.forEach(s => this.socials.push(this.createSocialGroup(s)));
  }

  get projects() { return this.form.get('projects') as FormArray; }
  get faqs() { return this.form.get('faqs') as FormArray; }
  get socials() { return this.form.get('socials') as FormArray; }

  createProjectGroup(p?: any) {
    return this.fb.group({
      id: [p?.id || ''],
      title: [p?.title || ''],
      description: [p?.description || ''],
      icon: [p?.icon || 'lucide:folder'],
      url: [p?.url || ''],
      tech: [p?.tech ? p.tech.join(', ') : ''],
      actionLabel: [p?.actionLabel || 'Acessar']
    });
  }
  
  createFaqGroup(f?: any) {
    return this.fb.group({
      id: [f?.id || ''],
      question: [f?.question || ''],
      answer: [f?.answer || '']
    });
  }

  createSocialGroup(s?: any) {
    return this.fb.group({
      id: [s?.id || ''],
      platform: [s?.platform || 'Rede Social'],
      icon: [s?.icon || 'lucide:link'],
      url: [s?.url || '']
    });
  }

  addProject() { this.projects.push(this.createProjectGroup()); }
  addFaq() { this.faqs.push(this.createFaqGroup()); }
  addSocial() { this.socials.push(this.createSocialGroup()); }

  removeProject(index: number) { this.projects.removeAt(index); }
  removeFaq(index: number) { this.faqs.removeAt(index); }
  removeSocial(index: number) { this.socials.removeAt(index); }

  async save() {
    const rawVal = this.form.value;
    
    const formattedData: AppData = {
      ...rawVal,
      about: {
        ...rawVal.about,
        skills: rawVal.about.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s)
      },
      projects: rawVal.projects.map((p: any) => ({
        ...p,
        tech: p.tech.split(',').map((t: string) => t.trim()).filter((t: string) => t)
      }))
    };

    try {
      this.isSaving = true;
      this.saveError = '';
      this.saved = false;
      this.cdr.detectChanges();
      
      await this.dataService.updateData(formattedData);
      this.saved = true;
      this.cdr.detectChanges();
      
      setTimeout(() => { 
        this.saved = false; 
        this.cdr.detectChanges();
      }, 3000);
    } catch (e: any) {
      console.error(e);
      if (e instanceof HttpErrorResponse && e.status === 401) {
          this.router.navigate(['/login']);
      }
      this.saveError = e.error?.error || e.message || 'Erro ao salvar. Tente atualizar a página.';
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  async logout() {
    try {
      await firstValueFrom(this.http.post('/api/logout', {}, { withCredentials: true }));
    } catch (e) {}
    this.router.navigate(['/login']);
  }
}
