import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

export interface AdminProfile {
  id: number;
  nom: string;
  email: string;
  photoUrl: string | null;
  role: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getMe() {
    return this.http.get<ApiResponse<AdminProfile>>(`${environment.apiUrl}/v1/admins/me`);
  }

  updateProfile(data: { nom?: string; email?: string }) {
    return this.http.put<ApiResponse<AdminProfile>>(`${environment.apiUrl}/v1/admins/update-profile`, data);
  }

  uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<AdminProfile>>(`${environment.apiUrl}/v1/admins/photo`, formData);
  }
}
