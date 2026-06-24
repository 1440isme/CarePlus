const SpecialtyRepository = require('./specialty.repository');
const SearchService = require('../search/search.service');
const {
  toAdminSpecialtyDto,
  toPublicSpecialtyDto,
  toSpecialtyListDto,
} = require('./specialty.dto');
const {
  SPECIALTY_ERROR_CODES,
  SPECIALTY_PAGINATION,
} = require('./specialty.types');

class SpecialtyServiceError extends Error {
  constructor({ code, message, statusCode, details = [] }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function generateSlug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

class SpecialtyService {
  constructor(specialtyRepository) {
    this.specialtyRepository = specialtyRepository;
  }

  async listPublicSpecialties(query) {
    try {
      const normalizedQuery = this._normalizeListQuery(query);

      let specialties;
      let total;

      if (normalizedQuery.search) {
        const searchResult = await SearchService.searchSpecialties({
          query: normalizedQuery.search,
          active: true,
          page: normalizedQuery.page,
          limit: normalizedQuery.limit
        });
        specialties = searchResult.data;
        total = searchResult.meta.total;
      } else {
        const filters = {
          search: normalizedQuery.search,
          skip: (normalizedQuery.page - 1) * normalizedQuery.limit,
          take: normalizedQuery.limit,
        };
        [specialties, total] = await Promise.all([
          this.specialtyRepository.findActiveSpecialties(filters),
          this.specialtyRepository.countActiveSpecialties(filters),
        ]);
      }

      return {
        data: toSpecialtyListDto(specialties),
        meta: {
          page: normalizedQuery.page,
          limit: normalizedQuery.limit,
          total,
          totalPages: Math.ceil(total / normalizedQuery.limit),
        },
      };
    } catch (error) {
      if (error instanceof SpecialtyServiceError) {
        throw error;
      }

      throw new SpecialtyServiceError({
        code: SPECIALTY_ERROR_CODES.LIST_SPECIALTIES_FAILED,
        message: 'Không thể lấy danh sách chuyên khoa',
        statusCode: 500,
      });
    }
  }

  async listSpecialties(query) {
    try {
      const normalizedQuery = this._normalizeListQuery(query);
      const filters = {
        search: normalizedQuery.search,
        skip: (normalizedQuery.page - 1) * normalizedQuery.limit,
        take: normalizedQuery.limit,
      };

      const [specialties, total] = await Promise.all([
        this.specialtyRepository.findSpecialties(filters),
        this.specialtyRepository.countSpecialties(filters),
      ]);

      return {
        data: toSpecialtyListDto(specialties, { includeTimestamps: true }),
        meta: {
          page: normalizedQuery.page,
          limit: normalizedQuery.limit,
          total,
          totalPages: Math.ceil(total / normalizedQuery.limit),
        },
      };
    } catch (error) {
      if (error instanceof SpecialtyServiceError) {
        throw error;
      }

      throw new SpecialtyServiceError({
        code: SPECIALTY_ERROR_CODES.LIST_SPECIALTIES_FAILED,
        message: 'Không thể lấy danh sách chuyên khoa',
        statusCode: 500,
      });
    }
  }

  async getSpecialtyById(id) {
    try {
      const specialty = await this.specialtyRepository.findSpecialtyById(id);

      if (!specialty || specialty.active === false) {
        throw new SpecialtyServiceError({
          code: SPECIALTY_ERROR_CODES.SPECIALTY_NOT_FOUND,
          message: 'Không tìm thấy chuyên khoa',
          statusCode: 404,
        });
      }

      return toPublicSpecialtyDto(specialty);
    } catch (error) {
      if (error instanceof SpecialtyServiceError) {
        throw error;
      }

      throw new SpecialtyServiceError({
        code: SPECIALTY_ERROR_CODES.GET_SPECIALTY_FAILED,
        message: 'Không thể lấy chi tiết chuyên khoa',
        statusCode: 500,
      });
    }
  }

  async createSpecialty(adminUser, dto) {
    try {
      void adminUser;

      const normalizedName = dto.name.trim();
      const normalizedSlug = typeof dto.slug === 'string'
        ? dto.slug.trim()
        : generateSlug(normalizedName);
      const existingSpecialty = await this.specialtyRepository.findSpecialtyByName(normalizedName);
      const existingSlugSpecialty = await this.specialtyRepository.findSpecialtyBySlug(normalizedSlug);

      if (existingSpecialty) {
        throw new SpecialtyServiceError({
          code: SPECIALTY_ERROR_CODES.SPECIALTY_ALREADY_EXISTS,
          message: 'Chuyên khoa đã tồn tại',
          statusCode: 409,
        });
      }

      if (existingSlugSpecialty) {
        throw new SpecialtyServiceError({
          code: SPECIALTY_ERROR_CODES.SPECIALTY_SLUG_ALREADY_EXISTS,
          message: 'Slug chuyên khoa đã tồn tại',
          statusCode: 409,
        });
      }

      const specialty = await this.specialtyRepository.createSpecialty({
        name: normalizedName,
        slug: normalizedSlug,
        description: dto.description?.trim() ?? '',
        icon: dto.icon?.trim() ?? '',
        doctorCount: 0,
        active: typeof dto.active === 'boolean' ? dto.active : true,
      });

      return {
        message: 'Tạo chuyên khoa thành công',
        specialty: toAdminSpecialtyDto(specialty),
      };
    } catch (error) {
      if (error instanceof SpecialtyServiceError) {
        throw error;
      }

      throw new SpecialtyServiceError({
        code: SPECIALTY_ERROR_CODES.CREATE_SPECIALTY_FAILED,
        message: 'Không thể tạo chuyên khoa',
        statusCode: 500,
      });
    }
  }

  async updateSpecialty(adminUser, id, dto) {
    try {
      void adminUser;

      const specialty = await this.specialtyRepository.findSpecialtyById(id);

      if (!specialty) {
        throw new SpecialtyServiceError({
          code: SPECIALTY_ERROR_CODES.SPECIALTY_NOT_FOUND,
          message: 'Không tìm thấy chuyên khoa',
          statusCode: 404,
        });
      }

      if (typeof dto.name === 'string') {
        const duplicateSpecialty = await this.specialtyRepository.findSpecialtyByNameExceptId(dto.name.trim(), id);

        if (duplicateSpecialty) {
          throw new SpecialtyServiceError({
            code: SPECIALTY_ERROR_CODES.SPECIALTY_ALREADY_EXISTS,
            message: 'Chuyên khoa đã tồn tại',
            statusCode: 409,
          });
        }
      }

      if (typeof dto.slug === 'string') {
        const duplicateSlugSpecialty = await this.specialtyRepository.findSpecialtyBySlugExceptId(dto.slug.trim(), id);

        if (duplicateSlugSpecialty) {
          throw new SpecialtyServiceError({
            code: SPECIALTY_ERROR_CODES.SPECIALTY_SLUG_ALREADY_EXISTS,
            message: 'Slug chuyên khoa đã tồn tại',
            statusCode: 409,
          });
        }
      }

      const updateData = this._buildUpdateData(dto);
      const updatedSpecialty = await this.specialtyRepository.updateSpecialty(id, updateData);

      return {
        message: 'Cập nhật chuyên khoa thành công',
        specialty: toAdminSpecialtyDto(updatedSpecialty),
      };
    } catch (error) {
      if (error instanceof SpecialtyServiceError) {
        throw error;
      }

      throw new SpecialtyServiceError({
        code: SPECIALTY_ERROR_CODES.UPDATE_SPECIALTY_FAILED,
        message: 'Không thể cập nhật chuyên khoa',
        statusCode: 500,
      });
    }
  }

  async deleteSpecialty(adminUser, id) {
    try {
      void adminUser;

      const specialty = await this.specialtyRepository.findSpecialtyById(id);

      if (!specialty) {
        throw new SpecialtyServiceError({
          code: SPECIALTY_ERROR_CODES.SPECIALTY_NOT_FOUND,
          message: 'Không tìm thấy chuyên khoa',
          statusCode: 404,
        });
      }

      const specialtyInUse = await this.specialtyRepository.isSpecialtyInUse(id);

      if (specialtyInUse) {
        throw new SpecialtyServiceError({
          code: SPECIALTY_ERROR_CODES.SPECIALTY_IN_USE,
          message: 'Không thể xóa chuyên khoa đang được sử dụng',
          statusCode: 400,
        });
      }

      const deletedSpecialty = await this.specialtyRepository.softDeleteSpecialty(id);

      return {
        message: 'Xóa chuyên khoa thành công',
        specialty: toAdminSpecialtyDto(deletedSpecialty),
      };
    } catch (error) {
      if (error instanceof SpecialtyServiceError) {
        throw error;
      }

      throw new SpecialtyServiceError({
        code: SPECIALTY_ERROR_CODES.DELETE_SPECIALTY_FAILED,
        message: 'Không thể xóa chuyên khoa',
        statusCode: 500,
      });
    }
  }

  _normalizeListQuery(query) {
    const page = Number.parseInt(query.page, 10) || SPECIALTY_PAGINATION.DEFAULT_PAGE;
    const rawLimit = Number.parseInt(query.limit, 10) || SPECIALTY_PAGINATION.DEFAULT_LIMIT;
    const limit = Math.min(rawLimit, SPECIALTY_PAGINATION.MAX_LIMIT);

    return {
      page,
      limit,
      search: typeof query.search === 'string' ? query.search.trim() : '',
    };
  }

  _buildUpdateData(dto) {
    const data = {};

    if (typeof dto.name === 'string') {
      data.name = dto.name.trim();
    }

    if (typeof dto.slug === 'string') {
      data.slug = dto.slug.trim();
    } else if (typeof dto.name === 'string') {
      data.slug = generateSlug(dto.name.trim());
    }

    if (typeof dto.description === 'string') {
      data.description = dto.description.trim();
    }

    if (typeof dto.icon === 'string') {
      data.icon = dto.icon.trim();
    }

    if (typeof dto.active === 'boolean') {
      data.active = dto.active;
    }

    return data;
  }
}

module.exports = new SpecialtyService(SpecialtyRepository);
