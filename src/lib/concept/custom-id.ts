/**
 * 직접 입력한 키워드를 합성 id로 인코딩한다.
 * downstream(rule-based, prompt)이 JSON에 없는 값의 label을 잃지 않도록
 * id에 label을 실어 전달한다.
 */
export const CUSTOM_PREFIX = 'custom:';

export const makeCustomId = (label: string): string => `${CUSTOM_PREFIX}${label}`;

export const isCustomId = (id: string): boolean => id.startsWith(CUSTOM_PREFIX);

export const customLabel = (id: string): string => id.slice(CUSTOM_PREFIX.length);
