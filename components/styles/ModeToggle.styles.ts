import { css } from "emotion";
import { colors } from "@anarock/pebble";

export const modeToggleWrapper = css({
  backgroundColor: "rgba(47, 47, 47, 0.58)",
  height: 40,
  width: 200,
  padding: 5,
  borderRadius: 20,
  display: "flex",
  position: "relative",
  flexDirection: "row",
  color: colors.gray.light,
  justifyItems: "center",
  userSelect: "none",
  div: {
    flex: 1,
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 13,
    zIndex: 9
  }
});

export const modeBackground = css({
  position: "absolute",
  width: "50%",
  height: 30,
  borderRadius: 17,
  backgroundColor: "rgba(230, 230, 230, 0.16)",
  transition: "all 200ms",
  "&.__write__": {
    transform: "translateX(90%)"
  }
});
