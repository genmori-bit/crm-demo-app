import { LightningCard, LightningCardHeader, LightningCardBody } from "@/components/ui/lightning-card";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary-500 rounded-sf flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-sf-text">設定</h1>
          <p className="text-xs text-sf-weak">システム設定・セキュリティ</p>
        </div>
      </div>

      <LightningCard>
        <LightningCardHeader title="アプリケーション設定" />
        <LightningCardBody>
          <p className="text-sm text-sf-weak">設定機能は今後のアップデートで追加予定です。</p>
        </LightningCardBody>
      </LightningCard>

      <LightningCard>
        <LightningCardHeader
          title="セキュリティに関する注意事項"
          icon={
            <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <LightningCardBody>
          <p className="text-sm font-semibold text-sf-text mb-3">本番環境での利用前に以下を必ず実施してください</p>
          <ul className="text-sm text-sf-text space-y-2">
            {[
              "NEXTAUTH_SECRETを強固なランダム文字列に変更する",
              "初期パスワードを変更する",
              "HTTPS化する",
              "権限管理・ロール管理を実装する",
              "監査ログを実装する",
              "レート制限を設定する",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <svg className="w-4 h-4 text-warning mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </LightningCardBody>
      </LightningCard>

      <LightningCard>
        <LightningCardHeader title="バージョン情報" />
        <LightningCardBody>
          <p className="text-sm font-semibold text-sf-text">Simple CRM v0.1.0</p>
          <p className="text-xs text-sf-weak mt-1">Next.js 15 · Prisma · SQLite</p>
        </LightningCardBody>
      </LightningCard>
    </div>
  );
}
