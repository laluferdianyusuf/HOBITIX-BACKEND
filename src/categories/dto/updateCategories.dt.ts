import { IsBoolean, IsNotEmpty, IsOptional, IsString, } from "class-validator";

export class UpdateCategoriesDto{

    @IsString()
      @IsNotEmpty()
      name: string;
    
      @IsString()
      @IsOptional()
      description?: string;
    
      @IsString()
      @IsNotEmpty()
      slug: string;
}