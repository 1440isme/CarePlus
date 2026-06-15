const prisma = require('../../infrastructure/database/prisma.client');

class BaseRepository {
  constructor(modelName) {
    this.modelName = modelName;
    this.prisma = prisma;
    this.model = prisma[modelName];
  }

  /**
   * Find a single record by its ID
   * @param {string} id 
   * @param {object} options Additional query options (select, include, where)
   */
  async findById(id, options = {}) {
    const defaultWhere = { id };
    
    // Auto-apply soft-delete filter if model supports active/isActive
    const softDeleteField = this._getSoftDeleteField();
    if (softDeleteField) {
      defaultWhere[softDeleteField] = true;
    }

    return this.model.findFirst({
      where: { ...defaultWhere, ...options.where },
      select: options.select,
      include: options.include,
    });
  }

  /**
   * Find a single record matching specific criteria
   * @param {object} where Query filters
   * @param {object} options Additional query options (select, include)
   */
  async findOne(where = {}, options = {}) {
    const defaultWhere = { ...where };
    const softDeleteField = this._getSoftDeleteField();
    if (softDeleteField && defaultWhere[softDeleteField] === undefined) {
      defaultWhere[softDeleteField] = true;
    }

    return this.model.findFirst({
      where: defaultWhere,
      select: options.select,
      include: options.include,
    });
  }

  /**
   * Find multiple records with pagination and sorting
   * @param {object} filters Pagination, sort, and other filter criteria
   * @param {object} options Additional query options (select, include)
   */
  async findMany(filters = {}, options = {}) {
    const { page = 1, limit = 10, sortBy, sortOrder = 'asc', ...restFilters } = filters;
    
    const where = { ...restFilters };
    const softDeleteField = this._getSoftDeleteField();
    if (softDeleteField && where[softDeleteField] === undefined) {
      where[softDeleteField] = true;
    }

    const queryLimit = Math.min(Math.max(1, limit), 100);
    const queryPage = Math.max(1, page);

    const queryOptions = {
      where,
      take: queryLimit,
      skip: (queryPage - 1) * queryLimit,
      select: options.select,
      include: options.include,
    };

    if (sortBy) {
      queryOptions.orderBy = {
        [sortBy]: sortOrder,
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.model.findMany(queryOptions),
      this.model.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: queryPage,
        limit: queryLimit,
        total,
        totalPages: Math.ceil(total / queryLimit),
      },
    };
  }

  /**
   * Create a new record
   * @param {object} data The record payload
   * @param {object} options Additional query options (select, include)
   */
  async create(data, options = {}) {
    return this.model.create({
      data,
      select: options.select,
      include: options.include,
    });
  }

  /**
   * Update an existing record by ID
   * @param {string} id 
   * @param {object} data The update payload
   * @param {object} options Additional query options (select, include)
   */
  async update(id, data, options = {}) {
    return this.model.update({
      where: { id },
      data,
      select: options.select,
      include: options.include,
    });
  }

  /**
   * Delete a record by ID (performs soft delete if supported, hard delete otherwise)
   * @param {string} id 
   */
  async delete(id) {
    const softDeleteField = this._getSoftDeleteField();
    if (softDeleteField) {
      return this.model.update({
        where: { id },
        data: { [softDeleteField]: false },
      });
    }
    
    return this.model.delete({
      where: { id },
    });
  }

  /**
   * Get soft delete field name if applicable
   * @returns {string|null} Field name ('active' or 'isActive') or null
   * @private
   */
  _getSoftDeleteField() {
    if (this.modelName === 'PatientProfile') {
      return 'isActive';
    }
    if (this.modelName === 'Doctor' || this.modelName === 'Specialty') {
      return 'active';
    }
    return null;
  }
}

module.exports = BaseRepository;
