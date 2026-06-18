export const PATIENT_PROFILE_API_PATHS = {
  root: '/patient-profiles',
  detail: (id) => `/patient-profiles/${id}`,
  setDefault: (id) => `/patient-profiles/${id}/default`,
};

export const PATIENT_PROFILE_QUERY_KEYS = {
  all: ['patient-profiles'],
  list: (params = {}) => ['patient-profiles', params],
};

export const PATIENT_PROFILE_GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

export const PATIENT_PROFILE_RELATIONSHIP_OPTIONS = [
  { value: 'SELF', label: 'Bản thân' },
  { value: 'CHA', label: 'Cha' },
  { value: 'ME', label: 'Mẹ' },
  { value: 'CON', label: 'Con' },
  { value: 'VO', label: 'Vợ' },
  { value: 'CHONG', label: 'Chồng' },
  { value: 'ANH', label: 'Anh' },
  { value: 'CHI', label: 'Chị' },
  { value: 'EM', label: 'Em' },
  { value: 'ONG', label: 'Ông' },
  { value: 'BA', label: 'Bà' },
  { value: 'KHAC', label: 'Khác' },
];

export const PATIENT_PROFILE_GENDER_LABELS = Object.fromEntries(
  PATIENT_PROFILE_GENDER_OPTIONS.map((option) => [option.value, option.label]),
);

export const PATIENT_PROFILE_RELATIONSHIP_LABELS = Object.fromEntries(
  PATIENT_PROFILE_RELATIONSHIP_OPTIONS.map((option) => [option.value, option.label]),
);

/**
 * @typedef {Object} PatientProfile
 * @property {string} id
 * @property {string} fullName
 * @property {string} phone
 * @property {'MALE' | 'FEMALE' | 'OTHER'} gender
 * @property {string} dateOfBirth
 * @property {string} relationship
 * @property {string | null | undefined} [address]
 * @property {boolean} isActive
 * @property {boolean | undefined} [isDefault]
 * @property {string | undefined} [createdAt]
 * @property {string | undefined} [updatedAt]
 */

/**
 * @typedef {Object} CreatePatientProfileRequest
 * @property {string} fullName
 * @property {string} phone
 * @property {'MALE' | 'FEMALE' | 'OTHER'} gender
 * @property {string} dateOfBirth
 * @property {string} relationship
 * @property {string | null | undefined} [address]
 */

/**
 * @typedef {CreatePatientProfileRequest} UpdatePatientProfileRequest
 */

/**
 * @typedef {Object} PatientProfilesResponse
 * @property {PatientProfile[]} data
 * @property {{ page: number, limit: number, total: number, totalPages: number }} [meta]
 */
