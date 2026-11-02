// Crom API v1のpageクエリの結果。SEARCH_QUERYと合わせる

export type AttributionType = "AUTHOR" | "REWRITE" | "TRANSLATOR" | "SUBMITTER" | (string & {});

export interface Attribution {
  user: { name: string | null } | null;
  type: AttributionType;
}

export interface PageRef {
  url: string;
}

export interface PageEntry {
  url: string;
  wikidotInfo: {
    title: string;
    createdAt: string;
    source?: string | null;
    tags?: string[];
  } | null;
  alternateTitles?: { title: string }[] | null;
  attributions?: Attribution[] | null;
  adultContentPage?: PageRef | null;
  adultSplashPage?: PageRef | null;
}

export interface TranslationOf extends PageEntry {
  translations?: PageEntry[] | null;
}

export interface SearchedPage extends PageEntry {
  translations?: PageEntry[] | null;
  translationOf?: TranslationOf | null;
}

// registryで差し替えた原語版の印
export interface DisplayEntry extends PageEntry {
  _registryCreatedDate?: string;
  _fromRegistry?: boolean;
}

export type LicenseLine =
  | { label: string; value: string; href?: undefined }
  | { label: string; href: string; value?: undefined };

export interface LicenseOptions {
  showOriginal: boolean;
  showYear: boolean;
}
