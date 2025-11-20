Run clasp push --force and redeploy to the production deployment ID.  Then commit and push changes to git.

clasp push --force && clasp deploy --deploymentId "AKfycbzVkh_qv32Jx7ohmhGNCuNH2ikuO-iXwHQ_glysRFCU5fyedrCzqLnYgiUHVNX0Blrr1Q" && git add . && git commit -m "[insert a detailed message about the commit]" && git push