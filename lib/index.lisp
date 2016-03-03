let
(assertEq a b) (if (a == b) 0 (throw 1))
{
    (letrec
        (testArray a b) (if (unit? a) 0 {
            (testArray (head a) (head b))
            (assertEq (tail a) (tail b))
        })
        (concat a b) (if (unit? b) a
            ((concat a (head b)) : (tail b)))
        (testArray
            ([1 2 3] `concat [4 5])
            [1 2 3 4 5]))

    (letrec
        ($ADD a b) (a + b)
        (assertEq ($ADD 1 2) 3))
    (let
        ($ADD a b) (a + b)
        (assertEq ($ADD 1 2) 3))
    (macro
        ($ADD a b) (a + b)
        (assertEq ($ADD 1 2) 3))

    (let
        (concat a b) (cast ((cast a 0) + (cast b 0)) "")
        (assertStrEq a b) (assertEq (cast a 0) (cast b 0))
        (assertStrEq ("hello" `concat " " `concat "world") "hello world"))

    (assertEq ("abc" . "length") 3)
}
