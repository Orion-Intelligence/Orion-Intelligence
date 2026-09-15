import { LicenseName } from '../../shared/model/licenses/license.rules';

export const LICENSE_LABEL: Partial<Record<LicenseName, string>> = {
  [LicenseName.MAINTAINER]: 'Maintainer',
  [LicenseName.FREE]: 'Free',
  [LicenseName.FEEDER]: 'Feeder',
  [LicenseName.OSINT_BASIC]: 'OSINT Basic',
  [LicenseName.OSINT_ADVANCED]: 'OSINT Advanced',
  [LicenseName.SOCIAL_MAPPER]: 'Social Mapper',
  [LicenseName.PENTESTER]: 'Pentester',
  [LicenseName.ENTERPRISE]: 'Enterprise'
};
