import { getConcerns } from '@hyliren/shared/src/server/data-store';
import { BuyersClient } from './BuyersClient';

export default function BuyersPage() {
  const concerns = getConcerns();
  return <BuyersClient concerns={concerns} />;
}
