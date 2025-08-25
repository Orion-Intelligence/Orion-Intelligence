import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TenantModel, UserStatus, SystemStatus } from '../../../shared/model/tenant/tenant.model';
import { ApiService } from '../../../shared/services/api.service';

@Component({
  selector: 'app-add-tenant',
  imports: [NgFor,
    FormsModule,
    ReactiveFormsModule],
  templateUrl: './add-tenant.component.html',
})
export class AddTenantComponent {
  tenantForm: FormGroup;
  userStatuses = Object.values(UserStatus);
  systemStatuses = Object.values(SystemStatus);

  constructor(private fb: FormBuilder, public api: ApiService) {
    this.tenantForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      userStatus: [UserStatus.PENDING, Validators.required],
      systemStatus: [SystemStatus.PENDING, Validators.required]
    });
  }

  onSubmit(): void {
    if (this.tenantForm.valid) {
      const formValues = this.tenantForm.value;

      const tenantData = {
        metadata: {
          name: formValues.name || null,
          email: formValues.email || null,
          userStatus: formValues.userStatus || 'PENDING',
          systemStatus: formValues.systemStatus || 'PENDING',
          verificationToken: '', // backend will override
          created_at: new Date(),
          updated_at: new Date()
        },
        mappings: {
          emails: [formValues.email], // optional
          phones: [] // optional
        }
      };

      this.api.post<TenantModel>('tenant/add', tenantData).subscribe({
        next: (res) => {
          console.log('Tenant created:', res);
        },
        error: (err) => console.error('Error creating tenant:', err)
      });
    }
  }

  onReset(): void {
    this.tenantForm.reset({
      userStatus: UserStatus.PENDING,
      systemStatus: SystemStatus.PENDING
    });
  }
}
