@echo off

if -%1-==-- echo Missing filename & exit /b
node index.js %*
