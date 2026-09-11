import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { CategoriesDto } from './dto/categories.dto.js';
import { UpdateCategoriesDto } from './dto/updateCategories.dt.js';
import { UpdateCategoryStatusDto } from './dto/updateCategoryStatus.dt.js';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService:CategoriesService){}

    @Post()
    create(@Body() data:CategoriesDto){
         console.log(data);

        return this.categoriesService.create(data)
    }
    @Put(":id")
    update(@Param("id") id:string, @Body() data:UpdateCategoriesDto){
        return this.categoriesService.update(id, data)
    }
    @Put(":id/status")
    updateStatus(@Param("id") id:string, @Body() data:UpdateCategoryStatusDto){
        return this.categoriesService.updateStatus(id, data)
    }
    @Delete(":id")
    delete(@Param("id") id:string){
        return this.categoriesService.delete(id)
    }
}
