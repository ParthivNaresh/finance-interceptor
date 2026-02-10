export interface ProfileMenuState {
  menuVisible: boolean;
  userEmail: string | undefined;
  handlePress: () => void;
  handleClose: () => void;
}
