// @vitest-environment jsdom
import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DataService, defaultData } from './data.service';

describe('DataService', () => {
  let service: DataService;
  let httpMock: HttpTestingController;

  beforeAll(() => {
    try {
      TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
    } catch(e) {}
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DataService]
    });
    service = TestBed.inject(DataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should be created and load initial data properly', () => {
    expect(service).toBeTruthy();
    
    // Due to the component or service structure, GET might be triggered
    const req = httpMock.expectOne({ method: 'GET'});
    expect(req.request.url).toContain('/api/content');
    
    req.flush(defaultData);
    
    expect(service.data().config.name).toBe(defaultData.config.name);
  });

  it('should send a POST request inside updateData', async () => {
    const reqInit = httpMock.expectOne({ method: 'GET'});
    reqInit.flush(defaultData);

    // Call updateData
    let error: any = null;
    service.updateData(defaultData).catch(e => error = e);

    const reqPost = httpMock.expectOne('/api/content');
    expect(reqPost.request.method).toBe('POST');
    reqPost.flush({ success: true });
    
    expect(error).toBeNull();
  });
});
