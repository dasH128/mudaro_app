import "server-only";

// Única puerta de entrada a los datos de empresas: páginas y acciones importan de aquí.
// TODO(supabase): hoy delega en el almacén en memoria (`store.ts`). Al conectar Supabase
// se sustituye la implementación, conservando estas firmas.
export {
  changeEstado,
  createEmpresa,
  getEmpresa,
  listEmpresas,
  regenerateInviteLink,
  resendInvite,
  type CreateEmpresaInput,
} from "./store";
