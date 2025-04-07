{pkgs}: {
  deps = [
    pkgs.suricata
    pkgs.postgresql
    pkgs.jq
    pkgs.glibcLocales
  ];
}
