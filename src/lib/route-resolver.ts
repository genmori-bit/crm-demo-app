/**
 * resolveRecordRoute
 *
 * オブジェクト種別とレコードIDからアプリ内URLを返す。
 * ルートが未実装の場合は null を返し、呼び出し側でリンク非表示にする。
 */
export type AppContext = "sales" | "marketing" | "setup" | undefined;

export function resolveRecordRoute(
  objectApiName: string,
  recordId: string,
  appContext?: AppContext,
): string | null {
  switch (objectApiName) {
    case "Account":
    case "Company":
      return `/companies/${recordId}`;
    case "Contact":
      return `/contacts/${recordId}`;
    case "Lead":
      return appContext === "marketing"
        ? `/ma/leads/${recordId}`
        : `/leads/${recordId}`;
    case "Opportunity":
    case "Deal":
      return `/deals/${recordId}`;
    case "Case":
      return `/cases/${recordId}`;
    case "Campaign":
      return appContext === "marketing"
        ? `/ma/campaigns/${recordId}`
        : `/campaigns/${recordId}`;
    case "Contract":
      return `/contracts/${recordId}`;
    case "Order":
      return `/orders/${recordId}`;
    case "Task":
      return `/tasks/${recordId}/edit`;
    case "User":
      return `/users/${recordId}`;
    case "MarketingEmail":
      return `/ma/emails/${recordId}`;
    case "MarketingForm":
      return `/ma/forms/${recordId}`;
    case "LandingPage":
      return `/ma/landing-pages/${recordId}`;
    case "EngagementProgram":
      return `/ma/engagement-programs/${recordId}`;
    // Activity は一覧ページのみ（個別詳細なし）
    case "Activity":
      return `/activities`;
    default:
      // カスタムオブジェクト (__c suffix)
      if (objectApiName.endsWith("__c")) {
        return `/custom/${objectApiName}/${recordId}`;
      }
      return null;
  }
}
