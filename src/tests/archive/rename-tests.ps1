# PowerShell script to rename .test.js files to .test.cjs
Get-ChildItem -Path "src\tests" -Filter "*.test.js" | ForEach-Object {
  $newName = $_.Name -replace '\.test\.js$', '.test.cjs'
  Rename-Item -Path $_.FullName -NewName $newName
  Write-Host "Renamed $($_.Name) to $newName"
}
