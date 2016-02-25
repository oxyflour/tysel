letrec
    len (\ list (if (pair? list) (len (head list) + 1) 1))
    (len (1, 2, 3, 4, 5, 6, 7))
