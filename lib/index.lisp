let
(assertEq a b) (if (a == b) "ok" (throw "assert equal failed"))
{
    (letrec
        (testArray a b) (if (unit? a) "" {
            (testArray (head a) (head b))
            (assertEq (tail a) (tail b))
        })
        (concat a b) (if (unit? b) a
            ((concat a (head b)) : (tail b)))
        (testArray
            ([1 2 3] `concat [4 5])
            [1 2 3 4 5]))

    (letrec
        (ADD a b) (a + b)
        (assertEq (ADD 1 2) 3))
    (let
        (ADD a b) (a + b)
        (assertEq (ADD 1 2) 3))
    (macro
        (ADD a b) (a + b)
        (assertEq (ADD 1 2) 3))

    (letrec
        zeroAsStr (cast 0 "")
        concatStr (cast `+ "" "" "")
        assertStrEq (cast assertEq "" "" true)
        (assertStrEq ("hello" `concatStr "world" `concatStr zeroAsStr) "helloworld0"))

    (import
        u "prelude.lisp"
        v "prelude/utils.lisp"
        (echo (u + v)))

    (assertEq ("abc" . "length") 3)
}
