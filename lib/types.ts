export type HoldingStatus = '貸出可' | '貸出中' | '館内' | '不明' | '更新中';

export interface WorkSource {
  name: string;
  url?: string;
}

export interface Work {
  id?: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishYear?: number;
  isbn?: string;
  summary?: string;
  cover?: string;
  ndc?: string;
  sources?: WorkSource[];
}

export interface Holding {
  isbn: string;
  sysid: string;
  status: HoldingStatus;
  updatedAt?: string;
}

export interface Recommendation {
  work: Work;
  score: number;
  holdings: Holding[];
}

export interface HoldingsResponse {
  holdings: Holding[];
  polled: boolean;
}
