import { Controller, Get, Post, Body, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DEAN)
  create(@Body() createAnnouncementDto: CreateAnnouncementDto, @Req() req: any) {
    const universityId = req.user.universityId;
    const createdBy = req.user.userId;
    return this.announcementsService.create(createAnnouncementDto, universityId, createdBy);
  }

  @Get()
  findAll(@Req() req: any) {
    const universityId = req.user.universityId;
    const userRole = req.user.role;
    return this.announcementsService.findAll(universityId, userRole);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const universityId = req.user.universityId;
    return this.announcementsService.findOne(id, universityId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Req() req: any) {
    const universityId = req.user.universityId;
    return this.announcementsService.remove(id, universityId);
  }
}
