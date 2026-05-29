import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** 시크릿 코드 (띄어쓰기 없음) */
const SECRET_CODE = '이모티콘은역시동동작가!';

interface UnlockState {
  unlocked: boolean;
  /** 코드가 일치하면 잠금을 해제하고 true 반환, 아니면 false */
  unlock: (code: string) => boolean;
}

export const useUnlockStore = create<UnlockState>()(
  persist(
    (set) => ({
      unlocked: false,
      unlock: (code) => {
        if (code.trim() === SECRET_CODE) {
          set({ unlocked: true });
          return true;
        }
        return false;
      },
    }),
    {
      name: 'emoticon-ai/unlock-v1',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : (undefined as unknown as Storage)
      ),
    }
  )
);
