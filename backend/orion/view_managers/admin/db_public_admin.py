from starlette_admin import FileField
from starlette_admin.contrib.odmantic import ModelView
from typing import Dict, Any
from fastapi import UploadFile
import os
from orion.services.mongo_manager.shared_model.db_public_model import Company
from odmantic import AIOEngine

class CompanyView(ModelView):
    def __init__(self, engine: AIOEngine, **kwargs):
        super().__init__(Company, **kwargs)
        self.engine = engine

    fields = [
        "name",
        "description",
        "founded_year",
        "is_active",
        "created_at",
        "tags",
        FileField("logo", label="Company Logo"),
    ]

    async def create_model(self, request, data: Dict[str, Any]):
        if "logo" in data:
            logo_file: UploadFile = data["logo"]
            if logo_file:
                os.makedirs("uploads", exist_ok=True)
                file_path = f"uploads/{logo_file.filename}"
                with open(file_path, "wb") as buffer:
                    buffer.write(await logo_file.read())
                data["logo"] = file_path

        company = Company(**data)
        await self.engine.save(company)
        return company

    async def update_model(self, request, pk: Any, data: Dict[str, Any]):
        if "logo" in data:
            logo_file: UploadFile = data["logo"]
            if logo_file:
                os.makedirs("uploads", exist_ok=True)
                file_path = f"uploads/{logo_file.filename}"
                with open(file_path, "wb") as buffer:
                    buffer.write(await logo_file.read())
                data["logo"] = file_path

        company = await self.engine.find_one(Company, Company.id == pk)
        if not company:
            raise ValueError("Company not found")

        for key, value in data.items():
            setattr(company, key, value)

        await self.engine.save(company)
        return company
