import ipRangeCheck from 'ip-range-check';

export const isIpAllowed = (ip: string, allowedIps: string | undefined) => {
  if (!allowedIps) {
    return true;
  }

  return allowedIps
    .split(',')
    .map((ip) => ip.trim())
    .some((allowedIp) => ipRangeCheck(ip, allowedIp));
};
